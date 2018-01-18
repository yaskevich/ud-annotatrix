"""
This is the backend for the annotatrix tool. It allows to save a project
on a server and load it when needed.
"""

from flask import Flask
from flask import jsonify
from flask import request
from flask import redirect
from flask import send_from_directory
from flask import url_for
import os
import uuid
from db import CorpusDB


PATH_TO_CORPORA = 'corpora'

app = Flask(__name__, static_folder='../standalone', static_url_path='/annotatrix')

if not os.path.exists(PATH_TO_CORPORA):
    os.mkdir(PATH_TO_CORPORA)


@app.route('/save', methods=['GET', 'POST'])
def save_corpus():
    if request.form:
        sent = request.form['content']
        treebank_id = request.form['treebank_id']
        path = treebank_id.strip('#') + '.db'
        sent_num = request.form['sentNum']
        if os.path.exists(PATH_TO_CORPORA + '/' + path):
            db = CorpusDB(PATH_TO_CORPORA + '/' + path)
            db.update_db(sent, sent_num)
        return jsonify()
    return jsonify()


@app.route('/load', methods=['GET', 'POST'])
def load_sentence():
    if request.form:
        treebank_id = request.form['treebank_id']
        path = treebank_id.strip('#') + '.db'
        sent_num = request.form['sentNum']
        if os.path.exists(PATH_TO_CORPORA + '/' + path):
            db = CorpusDB(PATH_TO_CORPORA + '/' + path)
            sent, max_sent = db.get_sentence(sent_num)
            return jsonify({'content': sent, 'max': max_sent})
        else:
            return jsonify({'content': 'something went wrong'})
    return jsonify()


@app.route('/annotatrix/upload', methods=['GET', 'POST'])
def upload_new_corpus():
    if request.method == 'POST':
        f = request.files['file']
        corpus_name = f.filename
        corpus = f.read().decode()
        treebank_id = str(uuid.uuid4())
        db = CorpusDB(PATH_TO_CORPORA + '/' + treebank_id + '.db')
        db.write_corpus(corpus, corpus_name)
        return redirect(url_for('corpus_page', treebank_id=treebank_id))
    return jsonify({'something': 'went wrong'})


@app.route('/annotatrix/running', methods=['GET'])
def running():
    return jsonify()


@app.route('/annotatrix/', methods=['GET', 'POST'])
def annotatrix():
    treebank_id = str(uuid.uuid4())
    return redirect(url_for('corpus_page', treebank_id=treebank_id))


@app.route('/', methods=['GET', 'POST'])
def index():
    return send_from_directory('../standalone', 'welcome_page.html')


@app.route('/<treebank_id>', methods=['GET', 'POST'])
def index_corpus(treebank_id):
    return redirect(url_for('corpus_page', treebank_id=treebank_id))


@app.route('/annotatrix/<treebank_id>')
def corpus_page(treebank_id):
    return send_from_directory('../standalone', 'annotator.html')


if __name__ == '__main__':
    app.secret_key = 'toshcpri]7f2ba027b824h6[hs87nja5enact'
    app.run(debug = True, port = 5316)