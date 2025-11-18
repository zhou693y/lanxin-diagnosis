from flask import Flask, request, jsonify
from LBIS import create_app
from LBIS.services import MedicalQAEngine # 新增会话管理器引用
from LBIS.config import Config
from openai import OpenAI

app = create_app()
medical_engine = MedicalQAEngine()

# 改造2：统一错误处理中间件
@app.errorhandler(Exception)
def handle_errors(e):
    return jsonify({
        "error": {
            "message": "服务暂时不可用",
            "type": "api_error" if isinstance(e, TimeoutError) else "invalid_request"
        }
    }), 500 if isinstance(e, TimeoutError) else 400


@app.route('/api/v1/treatment/recommend', methods=['POST'])
def recommend_treatment():
    data = request.get_json()
    diagnosis = data.get('diagnosis')
    symptoms = data.get('symptoms')
    patient_details = data.get('patient_details', '')
    session_id = data.get('session_id')

    if not diagnosis or not symptoms:
        return jsonify({"error": "缺少诊断结果或症状信息"}), 400

    # # 构造查询
    # query = f"""
    # 患者信息：{patient_details}
    # 诊断结果：{diagnosis}
    # 主要症状：{symptoms}

    # 请根据以上信息提供结构化的个性化治疗方案建议，包含以下部分：
    # 1. 主要治疗方法（标明药物处方类别，不提供具体剂量）
    # 2. 辅助治疗建议（饮食、生活方式调整）
    # 3. 康复指导（预期恢复时间、需要注意的症状）
    # 4. 禁忌与注意事项
    # """

    # 调用 MedicalQAEngine 查询
    result = medical_engine.generate_treatment_plan(
        diagnosis=data['diagnosis'],
        symptoms=data['symptoms'],
        patient_details=data.get('patient_details', {}),  # 改为字典格式
        session_id=data.get('session_id')
    )

    if 'error' in result:
        return jsonify(result), 500

    # 添加额外字段
    result['diagnosis'] = diagnosis
    result['symptoms'] = symptoms
    if 'answer' in result:
        result['treatment_plan'] = result.pop('answer')  # 重命名为 treatment_plan

    return jsonify(result)


@app.route('/api/v1/knowledge/common', methods=['GET'])
def get_common_diseases():
    """获取常见疾病列表"""
    try:
        # 从知识库中提取常见疾病
        common_diseases = []

        # 如果medical_engine有知识库，直接从中提取
        if hasattr(medical_engine, 'knowledge_base') and medical_engine.knowledge_base:
            # 提取前10个疾病
            diseases = list(medical_engine.knowledge_base.keys())[:10]
            common_diseases = [{"id": i, "name": name} for i, name in enumerate(diseases)]

        # 如果没有提取到疾病，返回一些默认值
        if not common_diseases:
            common_diseases = [
                {"id": 1, "name": "肝炎"},
                {"id": 2, "name": "肝硬化"},
                {"id": 3, "name": "脂肪肝"},
                {"id": 4, "name": "病毒性肝炎"},
                {"id": 5, "name": "酒精性肝病"}
            ]

        return jsonify({"diseases": common_diseases})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/knowledge/search', methods=['POST'])
def search_knowledge():
    """搜索知识库"""
    data = request.get_json()
    query = data.get('query', '')

    if not query:
        return jsonify({"results": []}), 400

    # 使用medical_engine的知识检索函数
    knowledge = medical_engine._retrieve_knowledge(query)

    # 构造结果
    results = []
    if knowledge:
        # 尝试从知识中提取关键信息
        lines = knowledge.split('\n\n')
        name = query
        description = ""
        symptoms = []
        treatment = ""
        prevention = ""

        # 尝试解析段落
        for line in lines:
            if '【疾病描述】' in line:
                description = line.replace('【疾病描述】', '').strip()
            elif '【主要症状】' in line:
                symptoms_text = line.replace('【主要症状】', '').strip()
                symptoms = [s.strip() for s in symptoms_text.split('、')]
            elif '【治疗方法】' in line:
                treatment = line.replace('【治疗方法】', '').strip()
            elif '【预防建议】' in line:
                prevention = line.replace('【预防建议】', '').strip()

        # 构造结果对象
        results.append({
            "id": 1,
            "name": name,
            "description": description,
            "symptoms": symptoms,
            "treatment": treatment,
            "prevention": prevention
        })

    return jsonify({"results": results})


@app.route('/api/v1/knowledge/disease/<int:disease_id>', methods=['GET'])
def get_disease_details(disease_id):
    """获取疾病详情"""
    # 在实际应用中，应该从数据库中检索
    # 这里返回一个模拟的响应
    disease = {
        "id": disease_id,
        "name": "示例疾病",
        "description": "这是一个示例疾病描述。在实际应用中，这应该从数据库中检索。",
        "symptoms": ["症状1", "症状2", "症状3"],
        "examinations": ["检查1", "检查2"],
        "treatment": "这是疾病的治疗方法描述。",
        "prevention": "这是疾病的预防建议。",
        "medications": ["药物1", "药物2"]
    }

    return jsonify(disease)


@app.route('/api/v1/create_session', methods=['POST'])
def create_session():
    """创建新会话"""
    try:
        session_id = medical_engine.conv_manager.create_session()
        return jsonify({"session_id": session_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/query', methods=['POST'])
def query_medical_engine():
    """查询医疗引擎"""
    data = request.get_json()
    question = data.get('question')
    session_id = data.get('session_id')

    if not question:
        return jsonify({"error": "请提供问题"}), 400

    # 调用医疗引擎
    result = medical_engine.query(question, session_id)
    return jsonify(result)
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)