from flask import Flask, request
from flask_cors import CORS

import pandas as pd
import json
import numpy as np
from scipy import spatial


app = Flask(__name__)
CORS(app)


def get_string(s):
    s = s.split('-')
    s = [i.capitalize() for i in s]
    s = ' '.join(s)
    return s


def get_title(s, label=True):
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


embeddings = np.load('embeddings.npy')
tsne = np.load('tsne.npy')

df = pd.read_csv('artistic_visual_storytelling.csv')
df['date'] = df['date'].astype(int)
df['end_date'] = df['date']
df['image_name'] = df['image'].apply(lambda x: get_title(x, label=False))
df['x'] = tsne[:, 0]
df['y'] = tsne[:, 1]
bins = ['tags', 'media', 'artist_nationality']
previous_req = {'id': None, 'ids': []}


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)


def filter_images(args_dict):
    imgs = pd.DataFrame()
    print(args_dict)

    for k in list(args_dict):
        if args_dict[k] == 'null' or args_dict[k] == 'undefined':
            del args_dict[k]

    if 'date' in args_dict and 'end_date' in args_dict:
        if int(args_dict['date']) > int(args_dict['end_date']):
            return imgs

        if args_dict['date'] == args_dict['end_date']:
            imgs = df[df['date'] == int(args_dict['date'])]

        del args_dict['date']
        del args_dict['end_date']

    else:
        if 'date' in args_dict:
            imgs = df[df['date'] >= int(args_dict['date'])]
            del args_dict['date']

        if 'end_date' in args_dict:
            imgs = df[df['end_date'] <= int(args_dict['end_date'])]
            del args_dict['end_date']

    for i in bins:
        if i in args_dict:
            if len(imgs):
                imgs = imgs[imgs[i].notna()]
            else:
                imgs = df[df[i].notna()]

    for i in args_dict:
        val = args_dict[i] if not args_dict[i].isnumeric(
        ) else int(args_dict[i])
        if len(imgs) == 0:
            if i in bins:
                imgs = df[df[i].str.contains(val)]
            else:
                imgs = df.loc[df[i] == val]
        else:
            if i in bins:
                imgs = imgs[imgs[i].str.contains(val)]
                print(imgs)

            else:
                imgs = imgs[imgs[i] == val]
    return imgs


@app.route('/icicle_data', methods=['POST'])
def get_icicle_data():
    global previous_req
    filters = request.get_json()
    levels = filters['levels']
    del filters['levels']
    payload = {'children': [], 'name': ''}

    if len(levels) == 0:
        return json.dumps({'payload': payload, 'images': []}, cls=NumpyEncoder)

    for k in filters:
        filters[k] = str(filters[k])

    images = []
    if 'id' in filters:

        if filters['id'] == previous_req['id']:
            ids = previous_req['ids']
        else:
            ids = get_similar_images(int(filters['id']))
            previous_req = {'id': filters['id'], 'ids': ids}
        new_df = df.iloc[ids]
        for i in ids:
            images.append({
                'id': int(i),
                'src': '/' + df.iloc[i].image,
                'thumbnail': '/' + df.iloc[i].image,
                'thumbnailWidth': 150,
                'thumbnailHeight': 150,
            'caption': f'Title: {get_title(df.iloc[i].image)} \nArtist: {get_string(df.iloc[i].artist_name)}\nYear: {int(df.iloc[i].date)} \nArtist Nationality: {df.iloc[i].artist_nationality.capitalize()}\nStyle: {df.iloc[i].style}',
                'tag': df.iloc[i]['tags'] if type(df.iloc[i]["tags"]) != float else 'N/A',
                'media': df.iloc[i]['media'] if type(df.iloc[i]["media"]) != float != "nan" else 'N/A',
                'artist_nationality': df.iloc[i]['artist_nationality'] if type(df.iloc[i]["artist_nationality"]) != float else 'N/A',
                'artist_name': df.iloc[i]['artist_name'],
                'x': df.iloc[i]['x'],
                'y': df.iloc[i]['y'],
                'date': df.iloc[i]['date'],
                'style': df.iloc[i]['style'] if type(df.iloc[i]['style']) != float else 'N/A',
                'heading':  get_title(df.iloc[i].image)})
    else:
        new_df = filter_images(filters)

    if len(new_df) != 0:
        # new_df = new_df.loc[new_df['date'] > 1850]
        # new_df['binned_by_date'] = pd.cut(
        #     new_df['date'], np.arange(1410, 2010, 20)).astype(str)
        grouped_df = pd.DataFrame(new_df.groupby(levels).size())
        grouped_df = grouped_df.rename({0: 'v'}, axis=1)

        for _, row in grouped_df.iterrows():
            names = np.array(row.name)
            if len(names.shape) == 0:
                names = [names]
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
    payload = json.dumps(
        {'payload': payload, 'images': images}, cls=NumpyEncoder)
    return payload


@app.route('/toy_data')
def toy_data():
    f = open('flare.json')
    obj = json.load(f)
    f.close()
    return json.dumps({'names': obj})


def get_similar_images(idx):

    selected_img = embeddings[idx]
    sims = []
    for i, img in enumerate(embeddings):
        sims.append(spatial.distance.cosine(img, selected_img))
    sims = np.array(sims)
    ids = np.argsort(sims)[0:50]

    # payload = []
    # for i in ids:
    #     payload.append({
    #         'id': int(i),
    #         'src': '/' + df.iloc[i].image,
    #         'thumbnail': '/' + df.iloc[i].image,
    #         'thumbnailWidth': 150,
    #         'thumbnailHeight': 150,
    #         'caption': f'Title: {get_title(df.iloc[i].image)} \nYear: {int(df.iloc[i].date)} \nArtist Nationality: {df.iloc[i].artist_nationality.capitalize()}',
    #         'tag': df.iloc[i]['tags'] if type(df.iloc[i]["tags"]) != float else 'N/A',
    #         'media': df.iloc[i]['media'] if type(df.iloc[i]["media"]) != float != "nan" else 'N/A',
    #         'artist_nationality': df.iloc[i]['artist_nationality'] if type(df.iloc[i]["artist_nationality"]) != float else 'N/A',
    #         'artist_name': df.iloc[i]['artist_name'],
    #         'x': df.iloc[i]['x'],
    #         'y': df.iloc[i]['y'],
    #         'date': df.iloc[i]['date'],
    #         'style': df.iloc[i]['style'] if type(df.iloc[i]['style']) != float else 'N/A',
    #         'heading':  get_title(df.iloc[i].image)})

    # payload = np.array(payload)
    # payload = payload.tolist()
    # payload = json.dumps({'names': payload}, cls=NumpyEncoder)
    return ids


@app.route('/filter_options')
def artists():

    cols = ['date', 'end_date', 'artist_name', 'artist_nationality',
            'style', 'tags', 'media', 'image_name']
    obj = {}
    for c in cols:
        obj[c] = np.unique(df[c].dropna().values)

    for c in bins:
        all_vals = []
        for i in obj[c]:
            all_vals += i.split(',')
        all_vals = np.unique(all_vals)
        obj[c] = all_vals

    payload = json.dumps({'payload': obj}, cls=NumpyEncoder)

    return payload


@app.route('/filtered_images', methods=['GET'])
def imagenames():
    args = request.args
    args_dict = args.to_dict()
    imgs = filter_images(args_dict)
    payload = []
    imgs = imgs.reset_index()
    for idx, row in imgs.iterrows():
        payload.append({
            'id': row.id,
            'src': '/' + row.image,
            'thumbnail': '/' + row.image,
            'thumbnailWidth': 100,
            'thumbnailHeight': 100,
            'caption': f'Title: {get_title(row.image)} \nArtist: {get_string(row.artist_name)}\nYear: {int(row.date)} \nArtist Nationality: {row.artist_nationality.capitalize()}\nStyle: {row.style}',
            'tag': row['tags'] if type(row["tags"]) != float else 'N/A',
            'media': row['media'] if type(row["media"]) != float != "nan" else 'N/A',
            'artist_nationality': row['artist_nationality'] if type(row["artist_nationality"]) != float else 'N/A',
            'artist_name': row['artist_name'],
            'x': row['x'],
            'y': row['y'],
            'style': row['style'] if type(row['style']) != float else 'N/A',
            'date': row['date'],
            'heading':  get_title(row.image)},
        )

    payload = np.array(payload)
    # payload = payload[0:50]
    payload = payload.tolist()
    payload = json.dumps({'names': payload}, cls=NumpyEncoder)
    return payload


if __name__ == '__main__':
    app.run(debug=True)
