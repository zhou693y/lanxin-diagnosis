# liver_bis/routes/views.py
from flask import render_template, Blueprint

bp = Blueprint('views', __name__)

@bp.route('/')
def index():
    """默认跳转到兰心慧诊系统"""
    return render_template('lanxin.html')

@bp.route('/old')
def old_system():
    """原系统入口"""
    return render_template('index.html')

@bp.route('/lanxin')
def lanxin():
    """兰心慧诊系统主页"""
    return render_template('lanxin.html')