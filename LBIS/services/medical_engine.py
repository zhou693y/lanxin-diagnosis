import json
import os
from typing import Dict, Any, List
from typing import Dict, Any
from ..config import Config
from .conversation import ConversationManager
import os
import re
import uuid
import requests
from dotenv import load_dotenv
from typing import Dict, List, Any
from flask import Flask, request, jsonify, render_template

class MedicalQAEngine:
    def __init__(self):
        self.api_key = Config.API_KEY
        self.api_endpoint = Config.API_ENDPOINT
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        self.conv_manager = ConversationManager(max_history=Config.MAX_HISTORY)

        # 加载知识库
        self.knowledge_base = self._load_knowledge_base()

        self.system_prompt = """[角色设定]
您是三甲医院肝病科主任医师，拥有20年临床经验

[回答规范]
1. 所有诊断建议必须标注"需临床检查确认"
2. 数值指标必须注明正常范围（示例：ALT 7-40 U/L）
3. 药物信息必须标明处方类别（例如：处方药、非处方药）
4. 治疗方案需结构化，包括：
   - 主要治疗方法
   - 辅助治疗建议（如饮食、生活方式调整）
   - 注意事项
5. 出现以下情况立即拒绝回答：
   - 具体用药剂量
   - 未经验证的替代疗法
   - 自我诊断指导"""
    def _load_knowledge_base(self) -> Dict[str, Dict[str, str]]:
        """
        从JSON文件加载知识库数据
        """
        knowledge_base = {}
        try:
            # 设置知识库文件路径
            knowledge_dir = os.path.join(os.path.dirname(__file__), '..', 'knowledge')

            # 确保知识库目录存在
            if not os.path.exists(knowledge_dir):
                os.makedirs(knowledge_dir)

            # 加载JSON文件
            for filename in os.listdir(knowledge_dir):
                if filename.endswith('.json'):
                    file_path = os.path.join(knowledge_dir, filename)
                    with open(file_path, 'r', encoding='utf-8') as file:
                        # 逐行读取JSON数据
                        for line in file:
                            try:
                                data = json.loads(line.strip())
                                # 提取疾病名称作为key
                                if 'name' in data:
                                    name = data['name']
                                    # 构建知识条目
                                    content = self._format_disease_content(data)
                                    knowledge_base[name] = {
                                        "description": data.get('desc', ''),
                                        "content": content
                                    }

                                    # 添加别名索引，使别名也能找到相同内容
                                    if 'symptom' in data:
                                        for symptom in data['symptom']:
                                            if symptom and len(symptom) > 1:  # 排除无效症状名
                                                knowledge_base[symptom] = {
                                                    "description": f"{name}的症状",
                                                    "content": f"症状'{symptom}'与疾病'{name}'相关。\n{content}"
                                                }
                            except json.JSONDecodeError:
                                print(f"解析JSON行时出错: {line}")
                                continue
        except Exception as e:
            print(f"加载知识库失败: {str(e)}")

        # 如果没有加载到知识，使用默认示例
        if not knowledge_base:
            knowledge_base = {
                "肝炎": {
                    "description": "病毒性肝炎类型及诊断标准",
                    "content": "甲肝通过粪口传播，乙肝通过血液传播。诊断需结合肝功能检查和血清学标志物检测。"
                },
                "肝硬化": {
                    "description": "肝硬化临床表现",
                    "content": "典型症状包括腹水、肝掌、蜘蛛痣。确诊需肝活检或瞬时弹性成像检测。"
                }
            }

        return knowledge_base

    def _format_disease_content(self, disease_data: Dict[str, Any]) -> str:
        """
        将疾病数据格式化为结构化内容
        """
        content_parts = []

        # 添加疾病描述
        if 'desc' in disease_data:
            content_parts.append(f"【疾病描述】\n{disease_data['desc']}")

        # 添加症状信息
        if 'symptom' in disease_data and disease_data['symptom']:
            symptoms = '、'.join(disease_data['symptom'])
            content_parts.append(f"【主要症状】\n{symptoms}")

        # 添加病因信息
        if 'cause' in disease_data and disease_data['cause']:
            content_parts.append(f"【病因分析】\n{disease_data['cause']}")

        # 添加检查信息
        if 'check' in disease_data and disease_data['check']:
            checks = '、'.join(disease_data['check'])
            content_parts.append(f"【推荐检查】\n{checks}")

        # 添加治疗方法
        if 'cure_way' in disease_data and disease_data['cure_way']:
            cure_ways = '、'.join(disease_data['cure_way'])
            content_parts.append(f"【治疗方法】\n{cure_ways}")

        # 添加药物推荐
        if 'recommand_drug' in disease_data and disease_data['recommand_drug']:
            drugs = '、'.join(disease_data['recommand_drug'])
            content_parts.append(f"【常用药物】\n{drugs}")

        # 添加预防建议
        if 'prevent' in disease_data and disease_data['prevent']:
            content_parts.append(f"【预防建议】\n{disease_data['prevent']}")

        return '\n\n'.join(content_parts)

    def _retrieve_knowledge(self, query: str) -> str:
        """
        从知识库中检索与查询相关的内容
        """
        # 计算每个知识条目的相关性得分
        relevance_scores = {}

        for key, data in self.knowledge_base.items():
            # 标题匹配得分 (精确匹配权重高)
            if key.lower() in query.lower():
                title_score = 10 if query.lower().find(key.lower()) != -1 else 3
            else:
                title_score = 0

            # 内容匹配得分
            content_score = 0
            content = data["content"].lower()
            description = data["description"].lower()

            # 分词查询 (简单实现，实际可使用jieba等分词库)
            query_words = set(query.lower().replace('，', ' ').replace(',', ' ').replace('。', ' ').split())
            for word in query_words:
                if len(word) > 1:  # 忽略单字词，减少噪音
                    if word in content:
                        content_score += 1
                    if word in description:
                        content_score += 0.5

            # 计算总分
            total_score = title_score + content_score
            if total_score > 0:
                relevance_scores[key] = total_score

        # 获取前2个最相关的知识条目
        sorted_keys = sorted(relevance_scores.keys(), key=lambda k: relevance_scores[k], reverse=True)
        top_keys = sorted_keys[:2]

        # 返回格式化的知识内容
        if top_keys:
            knowledge_content = "\n\n".join([f"【{key}】\n{self.knowledge_base[key]['content']}" for key in top_keys])
            return knowledge_content
        else:
            return ""

    def _safety_check(self, text: str) -> bool:
        prohibited_phrases = [
            '自行用药', '剂量调整', '替代疗法',
            '偏方', '网购药品', '建议停药'
        ]
        return any(phrase in text for phrase in prohibited_phrases)

    def _build_messages(self, session_id: str, query: str) -> List[Dict]:
        history = self.conv_manager.get_history(session_id)
        if not history:
            history.append({"role": "system", "content": self.system_prompt})

        knowledge = self._retrieve_knowledge(query)
        if knowledge:
            history.append({
                "role": "system",
                "content": f'【最新医学指南摘要】\n{knowledge}'
            })

        history.append({"role": "user", "content": query})
        return history

    def _process_response(self, raw_text: str) -> Dict:
        urgency_level = 2
        emergency_signs = ['吐血', '意识模糊', '剧烈腹痛']
        if any(sign in raw_text for sign in emergency_signs):
            urgency_level = 1
            raw_text += "\n【紧急警告】请立即前往急诊科就诊！"

        recommended_exams = []
        exam_keywords = {
            '肝功能': ['肝功能五项', '胆红素检测'],
            '超声': ['腹部超声'],
            'CT': ['增强CT扫描']
        }
        for keyword, exams in exam_keywords.items():
            if keyword in raw_text:
                recommended_exams.extend(exams)

        return {
            "answer": raw_text,
            "urgency": urgency_level,
            "recommended_exams": list(set(recommended_exams))
        }

    def query(self, question: str, session_id: str = None) -> Dict[str, Any]:
        try:
            if not session_id:
                session_id = self.conv_manager.create_session()

            if self._safety_check(question):
                return {
                    "error": "根据医疗规范，此问题需线下咨询专业医师",
                    "session_id": session_id
                }

            messages = self._build_messages(session_id, question)
            payload = {
                "model": "DeepSeek-R1-Distill-Qwen-7B-lora",
                "messages": messages,
                "temperature": Config.TEMPERATURE,
                "max_tokens": Config.MAX_TOKENS,
                "frequency_penalty": 0.5
            }

            response = requests.post(
                self.api_endpoint,
                headers=self.headers,
                json=payload,
                timeout=10
            )
            response.raise_for_status()

            answer = response.json()['choices'][0]['message']['content']

            self.conv_manager.add_message(session_id, "user", question)
            self.conv_manager.add_message(session_id, "assistant", answer)

            result = self._process_response(answer)
            result["session_id"] = session_id
            return result

        except requests.exceptions.RequestException as e:
            return {"error": f"API请求异常: {str(e)}", "session_id": session_id}
        except KeyError:
            return {"error": "API响应解析失败", "session_id": session_id}
        except Exception as e:
            return {"error": f"系统错误: {str(e)}", "session_id": session_id}

    import re

    def generate_treatment_plan(self, diagnosis, symptoms, patient_details, session_id=None):
        """
        生成个性化治疗方案
        """
        # 构建专门针对治疗方案的系统提示词
        treatment_prompt = """[角色设定]
    您是三甲医院主任医师，拥有20年临床经验，专长于制定个性化治疗方案

    [治疗方案格式]
    1. 主要治疗方法：
       - 必须标明药物的处方类别（处方药/非处方药）
       - 不提供具体剂量
       - 注明用药注意事项

    2. 辅助治疗建议：
       - 饮食建议
       - 生活方式调整
       - 必要的随访检查

    3. 康复指导：
       - 预期恢复时间
       - 需要注意的异常症状
       - 何时需要复诊

    4. 禁忌与注意事项：
       - 治疗期间避免的活动
       - 可能的治疗风险
       - 并发症预防

    [回答规范]
    - 所有建议必须以"仅供参考，具体用药方案应由主治医师确定"作为免责声明
    - 药物信息必须标明处方类别
    - 不得提供具体药物剂量
    - 必须根据患者信息进行个性化调整
    """

        # 构造查询
        query = f"""
    诊断结果：{diagnosis}
    主要症状：{symptoms}
    患者信息：{patient_details}

    请根据以上信息，按照规定格式提供个性化治疗方案建议。
    """

        # 初始化会话
        if not session_id:
            session_id = self.conv_manager.create_session()

        # 重置对话历史，添加系统提示
        history = []
        history.append({"role": "system", "content": self.system_prompt})
        history.append({"role": "system", "content": treatment_prompt})

        # 添加额外的知识检索，针对具体疾病
        knowledge = self._retrieve_knowledge(diagnosis)
        if knowledge:
            history.append({
                "role": "system",
                "content": f"[相关疾病治疗参考]\n{knowledge}"
            })

        # 添加用户查询
        history.append({"role": "user", "content": query})

        # 构建API请求信息
        payload = {
            "model": "DeepSeek-R1-Distill-Qwen-7B-lora",
            "messages": history,
            "temperature": 0.3,  # 降低温度以获得更稳定的输出
            "max_tokens": 800,  # 增加输出长度以获得完整治疗方案
            "frequency_penalty": 0.5
        }

        try:
            # 发送API请求
            response = requests.post(
                self.api_endpoint,
                headers=self.headers,
                json=payload,
                timeout=15
            )
            response.raise_for_status()

            answer = response.json()['choices'][0]['message']['content']

            # 保存到会话历史
            self.conv_manager.add_message(session_id, "user", query)
            self.conv_manager.add_message(session_id, "assistant", answer)

            # 处理响应结果
            result = self._process_treatment_response(answer, diagnosis)
            result["session_id"] = session_id

            return result
        except requests.exceptions.RequestException as e:
            return {"error": f"API请求异常: {str(e)}", "session_id": session_id}
        except KeyError:
            return {"error": "API响应解析失败", "session_id": session_id}
        except Exception as e:
            return {"error": f"系统错误: {str(e)}", "session_id": session_id}

    def _process_treatment_response(self, response_text, diagnosis):
        """
        处理治疗方案响应，提取相关信息
        """
        # 检测治疗方案的紧急程度
        urgency_level = 3  # 默认为一般

        if any(term in diagnosis.lower() for term in ['急性', '重度', '出血', '感染']):
            urgency_level = 2  # 中度紧急

        if any(term in diagnosis.lower() for term in ['危重', '休克', '梗死', '中毒']):
            urgency_level = 1  # 高度紧急

        # 提取建议检查
        recommended_exams = []
        exam_patterns = [
            r'建议.*?检查[：:](.*?)(?=\n|$)',
            r'推荐.*?检查[：:](.*?)(?=\n|$)',
            r'检查项目[：:](.*?)(?=\n|$)'
        ]

        for pattern in exam_patterns:
            matches = re.findall(pattern, response_text)
            for match in matches:
                exams = [exam.strip() for exam in match.split('、')]
                recommended_exams.extend(exams)

        # 也可以使用关键词匹配来查找推荐的检查
        common_exams = ['血常规', '尿常规', '肝功能', '肾功能', 'CT', 'MRI', '超声', 'X光', '心电图']
        for exam in common_exams:
            if exam in response_text and exam not in recommended_exams:
                recommended_exams.append(exam)

        return {
            "answer": response_text,
            "urgency": urgency_level,
            "recommended_exams": list(set(recommended_exams))
        }

