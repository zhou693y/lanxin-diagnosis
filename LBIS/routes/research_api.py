# 科研教学API路由
from flask import jsonify, request, Blueprint
from ..services.research_service import ResearchService

bp = Blueprint('research_api', __name__, url_prefix='/api/research')
research_service = ResearchService()


@bp.route('/clinical-research', methods=['POST'])
def clinical_research():
    """临床研究支持"""
    data = request.get_json()
    research_type = data.get('research_type', '')
    research_data = data.get('data', {})
    
    result = research_service.clinical_research_support(research_type, research_data)
    return jsonify(result)


@bp.route('/teaching-case', methods=['POST'])
def create_case():
    """创建教学案例"""
    data = request.get_json()
    result = research_service.create_teaching_case(data)
    return jsonify(result)


@bp.route('/teaching-case/search', methods=['POST'])
def search_cases():
    """搜索教学案例"""
    data = request.get_json()
    results = research_service.search_cases(data)
    return jsonify({"cases": results})


@bp.route('/teaching-case/<case_id>/analysis', methods=['GET'])
def analyze_case(case_id):
    """案例分析"""
    result = research_service.case_analysis_tool(case_id)
    return jsonify(result)


@bp.route('/education/<topic>', methods=['GET'])
def continuing_education(topic):
    """继续教育资源"""
    result = research_service.continuing_education_platform(topic)
    return jsonify(result)


@bp.route('/research-templates', methods=['GET'])
def get_research_templates():
    """获取科研模板"""
    return jsonify(research_service.research_templates)
