from flask import Flask, request
from flask_cors import CORS

import pandas as pd
import json
import numpy as np
from scipy import spatial


app = Flask(__name__)
CORS(app)
df = pd.read_csv('artistic_visual_storytelling.csv')
embeddings = np.load('embeddings.npy')


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)


def get_string(s):
    s = s.split('-')
    s = [i.capitalize() for i in s]
    s = ' '.join(s)
    return s


def get_title(s):
    s = s[7:]
    s = s.split('_')[1]
    s = get_string(s)
    s = s.split(' ')
    last_word = s[-1].split('.')[0]
    s = s[:-1]
    if not last_word.isnumeric():
        s.append(last_word)
    s = ' '.join(s)
    return s


@app.route('/icicle_data')
def get_icicle_data():

    new_df = df.copy(deep=True)
    new_df = new_df.loc[new_df['date'] > 1850]
    new_df['binned_by_date'] = pd.cut(
        new_df['date'], np.arange(1410, 2010, 20)).astype(str)
    grouped_df = pd.DataFrame(new_df.groupby(
        ['binned_by_date', 'style', 'media']).size())
    grouped_df = grouped_df.rename({0: 'v'}, axis=1)
    payload = {'children': [], 'name': 'root'}

    for _, row in grouped_df.iterrows():
        names = np.array(row.name)
        target = payload
        for n in names:

            if len(target['children']) == 0 or n != target['children'][-1]['name']:
                target['children'].append({'children': [], 'name': n})
                target = target['children'][-1]

            else:
                if 'value' in target['children'][-1]:
                    target['children'].append({})
                target = target['children'][-1]

        target['name'] = names[-1]
        target['value'] = row['v']
        del target['children']
    print(payload)
    payload = json.dumps({'names': payload}, cls=NumpyEncoder)
    return payload


@app.route('/toy_data')
def toy_data():
    f = open('flare.json')
    obj = json.load(f)
    f.close()
    return json.dumps({'names': obj})


@app.route('/similar_images', methods=['GET'])
def get_similar_images():

    args = request.args
    args_dict = args.to_dict()
    idx = int(args_dict['id'])
    selected_img = embeddings[idx]
    sims = []
    for i, img in enumerate(embeddings):
        sims.append(spatial.distance.cosine(img, selected_img))
    sims = np.array(sims)
    ids = np.argsort(sims)[1:4]

    payload = []
    for i in ids:
        payload.append({
            'id': int(i),
            'src': '/' + df.iloc[i].image,
            'thumbnail': '/' + df.iloc[i].image,
            'thumbnailWidth': 100,
            'thumbnailHeight': 100,
            'caption': f'Title: {get_title(df.iloc[i].image)} \nYear: {int(df.iloc[i].date)} \nArtist Nationality: {df.iloc[i].artist_nationality.capitalize()}',
            'heading':  get_title(df.iloc[i].image)})

    payload = np.array(payload)
    payload = payload.tolist()
    payload = json.dumps({'names': payload}, cls=NumpyEncoder)
    return payload


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
            'id': row.id,
            'src': '/' + row.image,
            'thumbnail': '/' + row.image,
            'thumbnailWidth': 100,
            'thumbnailHeight': 100,
            'caption': f'Title: {get_title(row.image)} \nYear: {int(row.date)} \nArtist Nationality: {row.artist_nationality.capitalize()}',
            'heading':  get_title(row.image)})

    payload = np.array(payload)
    payload = payload.tolist()
    payload = json.dumps({'names': payload}, cls=NumpyEncoder)
    return payload


if __name__ == '__main__':
    app.run(debug=True)
