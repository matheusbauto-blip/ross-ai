#!/usr/bin/env python3
"""Package a verified public build, backend sources and operating notes."""
import argparse
import json
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--site', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
site, output = Path(args.site).resolve(), Path(args.output).resolve()
manifest = json.loads((site / 'release.json').read_text())
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for entry in manifest['files']:
        relative = entry['path']
        if Path(relative).is_absolute() or '..' in Path(relative).parts:
            raise ValueError('Unsafe public asset')
        archive.write(site / relative, 'site/' + relative)
    archive.write(site / 'release.json', 'site/release.json')
    for source in (root / 'supabase/functions/ross-ai').iterdir():
        if source.suffix in ('.mjs', '.ts'):
            archive.write(source, 'servidor/ross-ai/' + source.name)
            archive.write(source, 'manutencao/supabase/functions/ross-ai/' + source.name)
    for name in ('scripts/build-library.mjs', 'scripts/sync-library.mjs',
                 'scripts/archive-library.py', 'scripts/lib/law-corpus.mjs',
                 'supabase/schema/library.sql'):
        archive.write(root / name, 'manutencao/' + name)
    for name in ('operacao-acervo.md', 'plano-acervo-brasil.md', 'acervo-brasil-fontes.md',
                 'publicacao.md', 'acompanhamento-processual.md', 'funcao-organizar-caso.md'):
        archive.write(root / 'docs' / name, 'documentacao/' + name)
    archive.writestr('COMO_PUBLICAR.txt',
        'ROSS AI — atualização do acervo brasileiro\n'
        'Versão do site preparado: ' + manifest['version'] + '\n'
        'Leia documentacao/operacao-acervo.md antes de publicar.\n'
        'O backend da busca ampliada foi atualizado e testado. A interface nova ainda não foi publicada.\n'
        'A importação em massa está pausada: a capacidade e o modo de somente leitura do banco precisam de manutenção.\n'
        'Não considere o acervo completo nem anuncie cobertura de todas as leis do Brasil.\n'
        'Publique somente o conteúdo de site/. Nunca publique servidor/, manutencao/ ou o ZIP do acervo.\n'
        'O acervo de textos é fornecido separadamente e não precisa ser baixado pelo navegador do cliente.\n'
        'Não há credenciais privadas neste pacote. Não é necessário comprar serviço para abrir o site.\n')
with zipfile.ZipFile(output) as archive:
    if archive.testzip() is not None:
        raise ValueError('Package integrity failure')
print(json.dumps({'file': str(output), 'bytes': output.stat().st_size, 'version': manifest['version']}))
