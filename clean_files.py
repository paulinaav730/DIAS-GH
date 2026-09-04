def clean(path):
    with open(path, 'r') as f:
        content = f.read()
    content = content.replace('\\n', '\n')
    with open(path, 'w') as f:
        f.write(content)

clean('src/components/DashboardView.tsx')
clean('src/components/PeopleView.tsx')
clean('src/App.tsx')
