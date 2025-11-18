# 预后预测服务模块
from typing import Dict, Any, List
from datetime import datetime, timedelta
import math


class PrognosisService:
    """预后预测服务"""
    
    def __init__(self):
        self.survival_models = self._init_survival_models()
    
    def _init_survival_models(self) -> Dict:
        """初始化生存预测模型参数"""
        return {
            "宫颈癌": {
                "stage_survival": {
                    "IA": 0.95, "IB": 0.90, "IIA": 0.75, "IIB": 0.65,
                    "IIIA": 0.45, "IIIB": 0.35, "IVA": 0.20, "IVB": 0.10
                },
                "risk_factors": {
                    "age_over_60": -0.15,
                    "lymph_node": -0.20,
                    "tumor_size_large": -0.10
                }
            },
            "卵巢癌": {
                "stage_survival": {
                    "I": 0.90, "II": 0.70, "III": 0.40, "IV": 0.20
                },
                "risk_factors": {
                    "age_over_60": -0.10,
                    "ascites": -0.15,
                    "ca125_high": -0.10
                }
            },
            "子宫内膜癌": {
                "stage_survival": {
                    "IA": 0.95, "IB": 0.90, "II": 0.80, "IIIA": 0.65,
                    "IIIB": 0.55, "IIIC": 0.45, "IVA": 0.25, "IVB": 0.15
                }
            },
            "乳腺癌": {
                "stage_survival": {
                    "0": 0.99, "I": 0.95, "IIA": 0.85, "IIB": 0.75,
                    "IIIA": 0.60, "IIIB": 0.50, "IIIC": 0.40, "IV": 0.25
                }
            }
        }
    
    def risk_stratification(self, patient_data: Dict) -> Dict[str, Any]:
        """精准风险分层"""
        tumor_type = patient_data.get('tumor_type', '宫颈癌')
        stage = patient_data.get('stage', 'I')
        age = patient_data.get('age', 50)
        
        # 基础风险评分
        base_risk = self._calculate_base_risk(tumor_type, stage)
        
        # 调整因素
        risk_modifiers = []
        if age > 60:
            base_risk += 10
            risk_modifiers.append("高龄")
        if patient_data.get('lymph_node_involvement'):
            base_risk += 15
            risk_modifiers.append("淋巴结转移")
        if patient_data.get('tumor_grade') == 'G3':
            base_risk += 10
            risk_modifiers.append("高分化")
        
        # 风险等级
        if base_risk >= 70:
            risk_level = "高风险"
            color = "danger"
        elif base_risk >= 40:
            risk_level = "中风险"
            color = "warning"
        else:
            risk_level = "低风险"
            color = "success"
        
        return {
            "risk_score": base_risk,
            "risk_level": risk_level,
            "risk_color": color,
            "risk_modifiers": risk_modifiers,
            "recommendation": self._get_risk_recommendation(risk_level)
        }
    
    def _calculate_base_risk(self, tumor_type: str, stage: str) -> int:
        """计算基础风险分数"""
        stage_risk_map = {
            "I": 20, "IA": 15, "IB": 25,
            "II": 40, "IIA": 35, "IIB": 45,
            "III": 65, "IIIA": 60, "IIIB": 70, "IIIC": 75,
            "IV": 85, "IVA": 80, "IVB": 90
        }
        return stage_risk_map.get(stage, 50)
    
    def _get_risk_recommendation(self, risk_level: str) -> str:
        """获取风险建议"""
        recommendations = {
            "高风险": "建议积极治疗，密切随访，每3个月复查一次",
            "中风险": "建议规范治疗，定期随访，每6个月复查一次",
            "低风险": "建议标准治疗，常规随访，每年复查一次"
        }
        return recommendations.get(risk_level, "请咨询专科医生")
    
    def survival_prediction(self, patient_data: Dict) -> Dict[str, Any]:
        """生存预测模型"""
        tumor_type = patient_data.get('tumor_type', '宫颈癌')
        stage = patient_data.get('stage', 'I')
        
        if tumor_type not in self.survival_models:
            return {"error": "不支持的肿瘤类型"}
        
        model = self.survival_models[tumor_type]
        base_survival = model["stage_survival"].get(stage, 0.5)
        
        # 应用风险因素调整
        adjusted_survival = base_survival
        if "risk_factors" in model:
            for factor, impact in model["risk_factors"].items():
                if patient_data.get(factor, False):
                    adjusted_survival += impact
        
        # 确保在0-1范围内
        adjusted_survival = max(0.0, min(1.0, adjusted_survival))
        
        # 计算不同时间点的生存率
        survival_rates = {
            "1年": round(adjusted_survival * 0.98, 3),
            "3年": round(adjusted_survival * 0.90, 3),
            "5年": round(adjusted_survival, 3),
            "10年": round(adjusted_survival * 0.85, 3)
        }
        
        return {
            "tumor_type": tumor_type,
            "stage": stage,
            "survival_rates": survival_rates,
            "median_survival": self._calculate_median_survival(adjusted_survival),
            "confidence_interval": f"{max(0, adjusted_survival-0.1):.2f} - {min(1, adjusted_survival+0.1):.2f}"
        }
    
    def _calculate_median_survival(self, survival_rate: float) -> str:
        """计算中位生存期"""
        if survival_rate > 0.9:
            return ">10年"
        elif survival_rate > 0.7:
            return "5-10年"
        elif survival_rate > 0.5:
            return "3-5年"
        elif survival_rate > 0.3:
            return "1-3年"
        else:
            return "<1年"
    
    def treatment_response_prediction(self, patient_data: Dict, treatment_plan: str) -> Dict[str, Any]:
        """治疗反应预测"""
        tumor_type = patient_data.get('tumor_type', '宫颈癌')
        stage = patient_data.get('stage', 'I')
        
        # 简化的治疗反应预测
        response_probability = {
            "完全缓解": 0.0,
            "部分缓解": 0.0,
            "稳定": 0.0,
            "进展": 0.0
        }
        
        # 根据分期调整
        if "I" in stage:
            response_probability = {"完全缓解": 0.70, "部分缓解": 0.20, "稳定": 0.08, "进展": 0.02}
        elif "II" in stage:
            response_probability = {"完全缓解": 0.50, "部分缓解": 0.30, "稳定": 0.15, "进展": 0.05}
        elif "III" in stage:
            response_probability = {"完全缓解": 0.30, "部分缓解": 0.35, "稳定": 0.25, "进展": 0.10}
        else:
            response_probability = {"完全缓解": 0.15, "部分缓解": 0.30, "稳定": 0.35, "进展": 0.20}
        
        return {
            "treatment_plan": treatment_plan,
            "response_probability": response_probability,
            "expected_response_time": "2-3个月",
            "monitoring_schedule": ["治疗后1个月", "治疗后3个月", "治疗后6个月"]
        }
    
    def recurrence_risk_assessment(self, patient_data: Dict, treatment_history: Dict) -> Dict[str, Any]:
        """复发风险评估"""
        tumor_type = patient_data.get('tumor_type', '宫颈癌')
        stage = patient_data.get('stage', 'I')
        treatment_complete = treatment_history.get('complete', True)
        
        # 基础复发风险
        base_risk = self._calculate_recurrence_base_risk(stage)
        
        # 调整因素
        if not treatment_complete:
            base_risk += 20
        if patient_data.get('positive_margins'):
            base_risk += 15
        if patient_data.get('lymphovascular_invasion'):
            base_risk += 10
        
        # 复发风险等级
        if base_risk >= 60:
            risk_level = "高复发风险"
            follow_up = "每3个月复查"
        elif base_risk >= 30:
            risk_level = "中复发风险"
            follow_up = "每6个月复查"
        else:
            risk_level = "低复发风险"
            follow_up = "每年复查"
        
        return {
            "recurrence_risk_score": base_risk,
            "risk_level": risk_level,
            "follow_up_schedule": follow_up,
            "high_risk_period": "治疗后2-3年",
            "monitoring_items": ["影像学检查", "肿瘤标志物", "体格检查"]
        }
    
    def _calculate_recurrence_base_risk(self, stage: str) -> int:
        """计算基础复发风险"""
        stage_recurrence_map = {
            "I": 10, "IA": 8, "IB": 12,
            "II": 25, "IIA": 20, "IIB": 30,
            "III": 45, "IIIA": 40, "IIIB": 50, "IIIC": 55,
            "IV": 70, "IVA": 65, "IVB": 75
        }
        return stage_recurrence_map.get(stage, 30)
    
    def dynamic_prediction_update(self, patient_id: str, new_data: Dict) -> Dict[str, Any]:
        """动态预测更新"""
        # 实际应用中应该从数据库读取历史数据
        return {
            "patient_id": patient_id,
            "update_time": datetime.now().isoformat(),
            "previous_prediction": "需要从历史记录获取",
            "updated_prediction": self.survival_prediction(new_data),
            "change_reason": "新的检查结果",
            "next_update_date": (datetime.now() + timedelta(days=90)).isoformat()
        }
