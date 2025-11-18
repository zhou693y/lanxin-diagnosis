# 病历生成服务模块
from typing import Dict, Any
from datetime import datetime
import json


class MedicalRecordService:
    """电子病历生成服务"""
    
    def __init__(self):
        self.record_templates = self._load_templates()
    
    def _load_templates(self) -> Dict:
        """加载病历模板"""
        return {
            "宫颈癌": {
                "chief_complaint": "异常阴道出血",
                "history_template": "患者主诉{duration}出现{symptoms}，{additional_info}",
                "physical_exam": ["宫颈检查", "阴道检查", "双合诊"],
                "lab_tests": ["宫颈细胞学", "HPV检测", "阴道镜"]
            },
            "卵巢癌": {
                "chief_complaint": "腹胀、腹痛",
                "history_template": "患者主诉{duration}出现{symptoms}，{additional_info}",
                "physical_exam": ["腹部检查", "盆腔检查"],
                "lab_tests": ["CA125", "盆腔超声", "CT"]
            },
            "子宫内膜癌": {
                "chief_complaint": "异常子宫出血",
                "history_template": "患者主诉{duration}出现{symptoms}，{additional_info}",
                "physical_exam": ["妇科检查", "子宫检查"],
                "lab_tests": ["经阴道超声", "子宫内膜活检"]
            },
            "乳腺癌": {
                "chief_complaint": "乳房肿块",
                "history_template": "患者主诉{duration}发现{symptoms}，{additional_info}",
                "physical_exam": ["乳房检查", "腋窝淋巴结检查"],
                "lab_tests": ["乳腺钼靶", "乳腺超声", "活检"]
            }
        }
    
    def extract_information(self, text: str) -> Dict[str, Any]:
        """智能信息提取"""
        # 简化的信息提取逻辑
        extracted = {
            "symptoms": [],
            "duration": "",
            "severity": "",
            "related_factors": []
        }
        
        # 症状关键词
        symptom_keywords = ["出血", "疼痛", "肿块", "分泌物", "腹胀", "消化不良"]
        for keyword in symptom_keywords:
            if keyword in text:
                extracted["symptoms"].append(keyword)
        
        # 时间提取
        time_keywords = ["天", "周", "月", "年"]
        for i, char in enumerate(text):
            if char.isdigit():
                for time_unit in time_keywords:
                    if time_unit in text[i:i+5]:
                        extracted["duration"] = text[i:i+5]
                        break
        
        return extracted
    
    def generate_record(self, patient_info: Dict, diagnosis_info: Dict, tumor_type: str = "宫颈癌") -> Dict[str, Any]:
        """生成专科病历"""
        template = self.record_templates.get(tumor_type, self.record_templates["宫颈癌"])
        
        record = {
            "record_id": f"MR{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "created_at": datetime.now().isoformat(),
            "patient_info": {
                "name": patient_info.get('name', ''),
                "age": patient_info.get('age', ''),
                "gender": "女",
                "id_number": patient_info.get('id_number', ''),
                "contact": patient_info.get('contact', '')
            },
            "chief_complaint": template["chief_complaint"],
            "present_illness": self._generate_present_illness(patient_info, template),
            "past_history": patient_info.get('past_history', ''),
            "family_history": patient_info.get('family_history', ''),
            "physical_examination": {
                "vital_signs": patient_info.get('vital_signs', {}),
                "specialized_exam": template["physical_exam"]
            },
            "auxiliary_examination": {
                "lab_tests": template["lab_tests"],
                "imaging": diagnosis_info.get('imaging_results', []),
                "pathology": diagnosis_info.get('pathology', '')
            },
            "diagnosis": {
                "preliminary": diagnosis_info.get('preliminary_diagnosis', ''),
                "differential": diagnosis_info.get('differential_diagnosis', []),
                "final": diagnosis_info.get('final_diagnosis', '')
            },
            "treatment_plan": diagnosis_info.get('treatment_plan', ''),
            "doctor_signature": "",
            "department": "妇科肿瘤科"
        }
        
        return record
    
    def _generate_present_illness(self, patient_info: Dict, template: Dict) -> str:
        """生成现病史"""
        symptoms = ", ".join(patient_info.get('symptoms', []))
        duration = patient_info.get('duration', '近期')
        additional = patient_info.get('additional_info', '无明显诱因')
        
        return template["history_template"].format(
            duration=duration,
            symptoms=symptoms,
            additional_info=additional
        )
    
    def update_record(self, record_id: str, updates: Dict) -> Dict[str, Any]:
        """更新病历"""
        # 实际应用中应该从数据库读取
        return {
            "record_id": record_id,
            "updated_at": datetime.now().isoformat(),
            "updates": updates,
            "status": "updated"
        }
    
    def export_record(self, record_id: str, format: str = "json") -> str:
        """导出病历"""
        # 实际应用中应该支持多种格式（PDF、Word等）
        if format == "json":
            return json.dumps({"record_id": record_id}, ensure_ascii=False, indent=2)
        return ""
