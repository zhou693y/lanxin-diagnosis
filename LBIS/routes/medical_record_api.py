# 病历管理API路由
from flask import jsonify, request, Blueprint
from ..services.medical_record_service import MedicalRecordService

bp = Blueprint('medical_record_api', __name__, url_prefix='/api/medical-record')
record_service = MedicalRecordService()


@bp.route('/extract-info', methods=['POST'])
def extract_information():
    """智能信息提取"""
    data = request.get_json()
    text = data.get('text', '')
    
    result = record_service.extract_information(text)
    return jsonify(result)


@bp.route('/generate', methods=['POST'])
def generate_record():
    """生成病历"""
    data = request.get_json()
    patient_info = data.get('patient_info', {})
    diagnosis_info = data.get('diagnosis_info', {})
    tumor_type = data.get('tumor_type', '宫颈癌')
    
    result = record_service.generate_record(patient_info, diagnosis_info, tumor_type)
    return jsonify(result)


@bp.route('/update/<record_id>', methods=['PUT'])
def update_record(record_id):
    """更新病历"""
    data = request.get_json()
    result = record_service.update_record(record_id, data)
    return jsonify(result)


@bp.route('/export/<record_id>', methods=['GET'])
def export_record(record_id):
    """导出病历"""
    format = request.args.get('format', 'json')
    result = record_service.export_record(record_id, format)
    
    if format == 'json':
        return jsonify({"data": result})
    return result


@bp.route('/templates', methods=['GET'])
def get_templates():
    """获取病历模板列表"""
    return jsonify({
        "templates": list(record_service.record_templates.keys())
    })
