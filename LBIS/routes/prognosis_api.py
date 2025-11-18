# 预后预测API路由
from flask import jsonify, request, Blueprint
from ..services.prognosis_service import PrognosisService

bp = Blueprint('prognosis_api', __name__, url_prefix='/api/prognosis')
prognosis_service = PrognosisService()


@bp.route('/risk-stratification', methods=['POST'])
def risk_stratification():
    """风险分层"""
    data = request.get_json()
    result = prognosis_service.risk_stratification(data)
    return jsonify(result)


@bp.route('/survival-prediction', methods=['POST'])
def survival_prediction():
    """生存预测"""
    data = request.get_json()
    result = prognosis_service.survival_prediction(data)
    return jsonify(result)


@bp.route('/treatment-response', methods=['POST'])
def treatment_response():
    """治疗反应预测"""
    data = request.get_json()
    patient_data = data.get('patient_data', {})
    treatment_plan = data.get('treatment_plan', '')
    
    result = prognosis_service.treatment_response_prediction(patient_data, treatment_plan)
    return jsonify(result)


@bp.route('/recurrence-risk', methods=['POST'])
def recurrence_risk():
    """复发风险评估"""
    data = request.get_json()
    patient_data = data.get('patient_data', {})
    treatment_history = data.get('treatment_history', {})
    
    result = prognosis_service.recurrence_risk_assessment(patient_data, treatment_history)
    return jsonify(result)


@bp.route('/dynamic-update', methods=['POST'])
def dynamic_update():
    """动态预测更新"""
    data = request.get_json()
    patient_id = data.get('patient_id')
    new_data = data.get('new_data', {})
    
    result = prognosis_service.dynamic_prediction_update(patient_id, new_data)
    return jsonify(result)
