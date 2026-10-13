"""Package only source/build/runtime assets. Never package user data or live secrets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
output = root / 'output' / 'bytepath-botkeep.zip'
output.parent.mkdir(exist_ok=True)
required = ['dist/index.html', '.runtime/manifest.json', 'package-lock.json']
for name in required:
    if not (root / name).is_file():
        raise SystemExit('Missing ' + name + '; build/setup first.')
folders = ['content', 'shared', 'server', 'src', 'dist', 'study documents', 'docs', '.runtime', 'tests', 'runner']
files = ['package.json', 'package-lock.json', 'README.md', '.env.example', '.env.botkeep.example', 'index.html', 'tsconfig.json', 'vite.config.ts', '.gitignore']
with ZipFile(output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for name in files:
        archive.write(root / name, name)
    for folder in folders:
        for path in (root / folder).rglob('*'):
            if path.is_file():
                archive.write(path, path.relative_to(root).as_posix())
    for path in (root / 'scripts').glob('*'):
        if path.is_file() and not path.name.startswith('probe-'):
            archive.write(path, path.relative_to(root).as_posix())
    names = archive.namelist()
    assert not any(name.startswith('.data/') or name == '.env' or 'node_modules/' in name for name in names)
print(f'{output.name}: {output.stat().st_size / 1024 / 1024:.1f} MB; no user data/API key included')
