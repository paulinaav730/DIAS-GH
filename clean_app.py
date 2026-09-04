def clean(path):
    with open(path, 'r') as f:
        content = f.read()
    # Replace literal backslash-n with actual newline
    content = content.replace('\\n', '\n')
    with open(path, 'w') as f:
        f.write(content)

clean('src/App.tsx')
