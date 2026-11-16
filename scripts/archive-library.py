#!/usr/bin/env python3
"""Archive verified source snapshots and locator metadata; never credentials."""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--directory', default='.corpus-library')
parser.add_argument('--output', required=True)
args = parser.parse_args()
directory, output = Path(args.directory).resolve(), Path(args.output).resolve()
manifest = json.loads((directory / 'manifest.json').read_text())
output.parent.mkdir(parents=True, exist_ok=True)
seen, verified = set(), {}
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    archive.writestr('LEIA_PRIMEIRO.txt',
        'ROSS AI — cópia do acervo brasileiro\n'
        'Textos disponíveis localmente e catálogo de localização do ctresb/leis.\n'
        'O catálogo não significa que todos os textos foram baixados.\n'
        'Há textos históricos, parciais e possivelmente revogados. A vigência não foi certificada.\n'
        'Os originais não são executados. SHA-256 em documentos/ e manifesto.json permitem conferir integridade.\n'
        'Este arquivo não deve ser colocado dentro da pasta pública do aplicativo.\n')
    for batch in manifest['batches']:
        name = Path(batch['file']).with_suffix('.json').name
        for document in json.loads((directory / name).read_text()):
            relative = document['repository_path']
            if relative in seen or '..' in Path(relative).parts or Path(relative).is_absolute():
                raise ValueError('Duplicate or unsafe corpus path')
            raw = document['markdown'].encode('utf-8')
            if hashlib.sha256(raw).hexdigest() != document['content_sha256']:
                raise ValueError('Snapshot integrity mismatch')
            seen.add(relative)
            verified[document['id']] = document['content_sha256']
            archive.writestr('textos/' + relative, raw)
            metadata = {k: v for k, v in document.items() if k not in ('markdown', 'passages')}
            archive.writestr('documentos/' + document['id'] + '.json', json.dumps(metadata, ensure_ascii=False))
    for batch in manifest['directoryBatches']:
        name = Path(batch['file']).with_suffix('.json').name
        archive.write(directory / name, 'catalogo/' + name)
    database_file = directory / 'database-snapshots.json'
    database_verified = 0
    if database_file.exists():
        rows = json.loads(database_file.read_text())
        for row in rows:
            if verified.get(row['document_id']) != row['content_sha256']:
                raise ValueError('A database snapshot is missing from the archive')
            database_verified += 1
        archive.write(database_file, 'backup/banco-snapshots.json')
    archive.writestr('manifesto.json', json.dumps({
        'repository': manifest['repository'], 'ref': manifest['ref'],
        'texts': len(seen), 'catalogFiles': manifest['candidateDocuments'],
        'databaseSnapshotsVerified': database_verified, 'completeBrazil': False,
        'excludedLargeFiles': manifest.get('rejected', [])
    }, ensure_ascii=False, indent=2))
with zipfile.ZipFile(output) as archive:
    if archive.testzip() is not None:
        raise ValueError('Archive validation failed')
print(json.dumps({'file': str(output), 'bytes': output.stat().st_size,
                  'texts': len(seen), 'databaseSnapshotsVerified': database_verified}))
