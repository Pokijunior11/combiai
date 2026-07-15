#!/usr/bin/env python3
"""Uvoz Heinner kataloga (bijela tehnika) u Supabase `article` tablicu.

Čita Excel proizvođača (Package box / BRUTTO dimenzije — to se utovaruje), mapira na
naš model i ubacuje samo NOVE artikle (po `code`, preskače postojeće → idempotentno).

Preduvjet (jednom, u Supabase SQL editoru):
    alter table article add column if not exists ean text;
    alter table article add column if not exists category text;

Uporaba:
    python tools/import_heinner.py --file "C:/Users/.../HEINNER _Q2_ADRIA.xlsx" --dry
    python tools/import_heinner.py --file "...xlsx" --insert
Zadani list: MDA. Supabase URL/ključ se čitaju iz app/.env (VITE_SUPABASE_*).
"""
import argparse, json, os, re, sys, urllib.request

def num(v):
    """Broj iz ćelije; kod raspona ('60.5 - 88.5') uzmi veći. None ako nema broja."""
    if v is None:
        return None
    s = str(v).replace('\xa0', '').strip()
    m = re.findall(r'\d+[.,]?\d*', s)
    if not m:
        return None
    return max(float(x.replace(',', '.')) for x in m)

def load_env(app_dir):
    env = open(os.path.join(app_dir, '.env'), encoding='utf-8').read()
    url = re.search(r'VITE_SUPABASE_URL=(\S+)', env).group(1)
    key = re.search(r'VITE_SUPABASE_ANON_KEY=(\S+)', env).group(1)
    return url, key

def parse_sheet(path, sheet):
    import openpyxl
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True)[sheet]
    rows = list(ws.iter_rows(values_only=True))[2:]  # red 0 = grupni header, red 1 = header
    good, bad = [], []
    for r in rows:
        code, cat, ean, desc = r[1], r[0], r[5], r[3]
        if not code or not desc:
            continue  # prazan/razdjelni red
        # Package box (brutto): L=10, W=11, H=12, Weight=13
        L, W, H, Wt = num(r[10]), num(r[11]), num(r[12]), num(r[13])
        rec = {
            'code': str(code).strip(),
            'name': ' '.join(str(desc).split()),
            'ean': str(ean).strip() if ean else None,
            'category': str(cat).strip() if cat else None,
            'length_cm': L, 'width_cm': W, 'height_cm': H, 'weight_kg': Wt,
            'can_lie': False,  # Heinner ne daje orijentaciju → default uspravno; tuning po §4c
        }
        (bad if (not all([L, W, H, Wt])) else good).append(rec)
    # dedup po `code` (Heinner ponekad isti SKU navede dvaput) — `code` je unique u bazi
    seen, uniq = set(), []
    for g in good:
        if g['code'] in seen:
            continue
        seen.add(g['code']); uniq.append(g)
    return uniq, bad

def http(url, key, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url + '/rest/v1/' + path, data=data, method=method, headers={
        'apikey': key, 'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json', 'Prefer': 'return=minimal',
    })
    return urllib.request.urlopen(req)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--file', required=True)
    ap.add_argument('--sheet', default='MDA')
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--insert', action='store_true')
    a = ap.parse_args()
    app_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app')
    good, bad = parse_sheet(a.file, a.sheet)
    print(f"List {a.sheet}: {len(good)} čistih, {len(bad)} s nepotpunim dimenzijama (preskačem).")
    for b in bad:
        print(f"  SKIP {b['code']}: {b['category']}")
    if a.dry or not a.insert:
        for g in good[:5]:
            print(f"  OK {g['code']} | {g['name'][:34]} | {g['length_cm']}x{g['width_cm']}x{g['height_cm']} {g['weight_kg']}kg")
        print("(dry run — ništa nije upisano; dodaj --insert za upis)")
        return
    url, key = load_env(app_dir)
    existing = {r['code'] for r in json.load(http(url, key, 'GET', 'article?select=code'))}
    todo = [g for g in good if g['code'] not in existing]
    print(f"Već u bazi: {len(existing)} | za dodati: {len(todo)}")
    for i in range(0, len(todo), 100):
        http(url, key, 'POST', 'article', todo[i:i + 100])
        print(f"  upisano {min(i + 100, len(todo))}/{len(todo)}")
    print("Gotovo.")

if __name__ == '__main__':
    main()
