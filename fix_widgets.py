import os

file_path = '/Users/eugeniucazmal/Downloads/dev_office/cashpot_online_new/app/src/App.svelte'
with open(file_path, 'r') as f:
    content = f.read()

# Replace width: {(widgetsSource... with --widget-w: ... and add class
lines = content.split('\n')
for i, line in enumerate(lines):
    if '<div style="order:{pco.indexOf(' in line and '; width: {(widgetsSource' in line:
        # line: <div style="order:{...}; width: {(widgetsSource...? '33.333%' : ... : '100%'};">
        new_line = line.replace('width: {(widgetsSource', '--widget-w: {(widgetsSource')
        new_line = new_line.replace('<div style="', '<div class="cms-widget-wrapper" style="')
        lines[i] = new_line

with open(file_path, 'w') as f:
    f.write('\n'.join(lines))

print("Done")
