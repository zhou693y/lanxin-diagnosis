# 智能诊断服务模块
from typing import Dict, Any, List
import json


class DiagnosisService:
    """智能诊断核心服务"""
    
    def __init__(self):
        self.tumor_knowledge = self._load_tumor_knowledge()
    
    def _load_tumor_knowledge(self) -> Dict:
        """加载女性肿瘤知识库"""
        return {
            "宫颈癌": {
                "symptoms": ["异常阴道出血", "接触性出血", "阴道分泌物增多", "下腹疼痛"],
                "risk_factors": ["HPV感染", "多个性伴侣", "吸烟", "免疫力低下"],
                "screening": ["宫颈细胞学检查", "HPV检测", "阴道镜检查"],
                "staging": ["IA期", "IB期", "IIA期", "IIB期", "IIIA期", "IIIB期", "IVA期", "IVB期"]
            },
            "卵巢癌": {
                "symptoms": ["腹胀", "腹痛", "消化不良", "尿频", "体重下降"],
                "risk_factors": ["年龄>50岁", "BRCA基因突变", "未生育", "家族史"],
                "screening": ["CA125检测", "盆腔超声", "CT/MRI"],
                "staging": ["I期", "II期", "III期", "IV期"]
            },
            "子宫内膜癌": {
                "symptoms": ["异常子宫出血", "绝经后出血", "下腹疼痛", "阴道分泌物"],
                "risk_factors": ["肥胖", "糖尿病", "高血压", "未生育", "雌激素治疗"],
                "screening": ["经阴道超声", "子宫内膜活检", "宫腔镜检查"],
                "staging": ["IA期", "IB期", "II期", "IIIA期", "IIIB期", "IIIC期", "IVA期", "IVB期"]
            },
            "乳腺癌": {
                "symptoms": ["乳房肿块", "乳头溢液", "乳房皮肤改变", "腋窝淋巴结肿大"],
                "risk_factors": ["BRCA基因突变", "家族史", "初潮早", "绝经晚", "未生育"],
                "screening": ["乳腺钼靶", "乳腺超声", "MRI", "活检"],
                "staging": ["0期", "I期", "IIA期", "IIB期", "IIIA期", "IIIB期", "IIIC期", "IV期"]
            }
        }
    
    def structured_symptom_collection(self, tumor_type: str) -> Dict[str, Any]:
        """结构化症状采集"""
        if tumor_type not in self.tumor_knowledge:
            return {"error": "不支持的肿瘤类型"}
        
        knowledge = self.tumor_knowledge[tumor_type]
        return {
            "tumor_type": tumor_type,
            "symptom_checklist": knowledge["symptoms"],
            "risk_factor_checklist": knowledge["risk_factors"],
            "recommended_screening": knowledge["screening"]
        }
    
    def risk_assessment(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """危险因素评估"""
        risk_score = 0
        risk_factors_found = []
        
        age = patient_data.get('age', 0)
        family_history = patient_data.get('family_history', False)
        symptoms = patient_data.get('symptoms', [])
        
        # 年龄评分
        if age > 50:
            risk_score += 2
            risk_factors_found.append("年龄>50岁")
        elif age > 40:
            risk_score += 1
            risk_factors_found.append("年龄>40岁")
        
        # 家族史评分
        if family_history:
            risk_score += 3
            risk_factors_found.append("有家族史")
        
        # 症状评分
        if len(symptoms) >= 3:
            risk_score += 2
            risk_factors_found.append(f"多个症状({len(symptoms)}个)")
        
        # 风险等级
        if risk_score >= 5:
            risk_level = "高风险"
            recommendation = "建议立即就医进行全面检查"
        elif risk_score >= 3:
            risk_level = "中风险"
            recommendation = "建议尽快预约专科医生"
        else:
            risk_level = "低风险"
            recommendation = "建议定期体检"
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors_found,
            "recommendation": recommendation
        }
    
    def differential_diagnosis(self, symptoms: List[str], exam_results: Dict = None) -> List[Dict]:
        """鉴别诊断系统"""
        possible_diagnoses = []
        
        for tumor_type, knowledge in self.tumor_knowledge.items():
            match_count = sum(1 for s in symptoms if s in knowledge["symptoms"])
            if match_count > 0:
                confidence = (match_count / len(knowledge["symptoms"])) * 100
                possible_diagnoses.append({
                    "diagnosis": tumor_type,
                    "confidence": round(confidence, 2),
                    "matched_symptoms": match_count,
                    "total_symptoms": len(knowledge["symptoms"]),
                    "recommended_tests": knowledge["screening"]
                })
        
        # 按置信度排序
        possible_diagnoses.sort(key=lambda x: x["confidence"], reverse=True)
        return possible_diagnoses
    
    def staging_evaluation(self, tumor_type: str, clinical_data: Dict) -> Dict[str, Any]:
        """分期评估系统"""
        if tumor_type not in self.tumor_knowledge:
            return {"error": "不支持的肿瘤类型"}
        
        knowledge = self.tumor_knowledge[tumor_type]
        
        # 简化的分期逻辑（实际应用中需要更复杂的算法）
        tumor_size = clinical_data.get('tumor_size', 0)
        lymph_node = clinical_data.get('lymph_node_involvement', False)
        metastasis = clinical_data.get('distant_metastasis', False)
        
        if metastasis:
            stage = knowledge["staging"][-1] if knowledge["staging"] else "IV期"
        elif lymph_node:
            stage = knowledge["staging"][len(knowledge["staging"])//2] if knowledge["staging"] else "III期"
        elif tumor_size > 5:
            stage = knowledge["staging"][2] if len(knowledge["staging"]) > 2 else "II期"
        else:
            stage = knowledge["staging"][0] if knowledge["staging"] else "I期"
        
        return {
            "tumor_type": tumor_type,
            "stage": stage,
            "tnm_classification": {
                "T": f"T{min(tumor_size//2, 4)}",
                "N": "N1" if lymph_node else "N0",
                "M": "M1" if metastasis else "M0"
            },
            "prognosis": self._get_prognosis(stage)
        }
    
    def _get_prognosis(self, stage: str) -> str:
        """获取预后信息"""
        if "I" in stage and "II" not in stage and "III" not in stage and "IV" not in stage:
            return "早期，预后较好，5年生存率>90%"
        elif "II" in stage:
            return "中期，预后中等，5年生存率60-80%"
        elif "III" in stage:
            return "局部晚期，需积极治疗，5年生存率30-50%"
        else:
            return "晚期，需综合治疗，5年生存率<30%"
