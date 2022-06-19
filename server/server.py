from flask import Flask, request
from flask_cors import CORS

import pandas as pd
import json
import numpy as np

app = Flask(__name__)
CORS(app)
df = pd.read_csv('artistic_visual_storytelling.csv')


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


def get_string(s):
    s = s.split('-')
    s = [i.capitalize() for i in s]
    s = ' '.join(s)
    return s


@app.route('/artists')
def artists():
    names = np.unique(df.artist_name.values)
    names = json.dumps({'names': names}, cls=NumpyEncoder)
    return names


@app.route('/filtered_images', methods=['GET'])
def imagenames():
    args = request.args
    args_dict = args.to_dict()
    imgs = pd.DataFrame()
    print(args_dict)
    for i in args_dict:
        val = args_dict[i] if not args_dict[i].isnumeric(
        ) else float(args_dict[i])
        if len(imgs) == 0:
            imgs = df.loc[df[i] == val]
        else:
            imgs = imgs.loc[imgs[i] == val]

    payload = []
    imgs = imgs.reset_index()
    for idx, row in imgs.iterrows():
        payload.append({
            'src': '/' + row.image, 'thumbnail': '/' + row.image, 'thumbnailWidth': 100, 'thumbnailHeight': 100})

    payload = np.array(payload)
    payload = payload[:min(len(payload), 10)].tolist()
    payload = json.dumps({'names': payload}, cls=NumpyEncoder)
    return payload


if __name__ == '__main__':
    app.run(debug=True)
