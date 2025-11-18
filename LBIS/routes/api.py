# liver_bis/routes/api.py
from flask import jsonify, request, Blueprint
from ..extensions import medical_engine

bp = Blueprint('api', __name__, url_prefix='/api')  # 添加 url_prefix

@bp.route('/query', methods=['POST'])
def query_endpoint():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    result = medical_engine.query(
        question=data.get("question"),
        session_id=data.get("session_id")
    )
    return jsonify(result)

@bp.route('/create_session', methods=['POST'])
def create_session_endpoint():
    try:
        session_id = medical_engine.conv_manager.create_session()
        return jsonify({"session_id": session_id})
    except Exception as e:
        return jsonify({"error": f"Session creation failed: {str(e)}"}), 500