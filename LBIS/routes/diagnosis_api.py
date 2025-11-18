# 诊断相关API路由
from flask import jsonify, request, Blueprint
from ..services.diagnosis_service import DiagnosisService

bp = Blueprint('diagnosis_api', __name__, url_prefix='/api/diagnosis')
diagnosis_service = DiagnosisService()


@bp.route('/symptom-collection/<tumor_type>', methods=['GET'])
def get_symptom_checklist(tumor_type):
    """获取结构化症状采集表"""
    result = diagnosis_service.structured_symptom_collection(tumor_type)
    return jsonify(result)


@bp.route('/risk-assessment', methods=['POST'])
def assess_risk():
    """危险因素评估"""
    data = request.get_json()
    result = diagnosis_service.risk_assessment(data)
    return jsonify(result)


@bp.route('/differential-diagnosis', methods=['POST'])
def differential_diagnosis():
    """鉴别诊断"""
    data = request.get_json()
    symptoms = data.get('symptoms', [])
    exam_results = data.get('exam_results', {})
    
    result = diagnosis_service.differential_diagnosis(symptoms, exam_results)
    return jsonify({"possible_diagnoses": result})


@bp.route('/staging', methods=['POST'])
def staging_evaluation():
    """分期评估"""
    data = request.get_json()
    tumor_type = data.get('tumor_type')
    clinical_data = data.get('clinical_data', {})
    
    result = diagnosis_service.staging_evaluation(tumor_type, clinical_data)
    return jsonify(result)


@bp.route('/tumor-types', methods=['GET'])
def get_tumor_types():
    """获取支持的肿瘤类型"""
    return jsonify({
        "tumor_types": list(diagnosis_service.tumor_knowledge.keys())
    })
