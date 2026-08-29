import json

with open('apps-script/Code.gs', 'r', encoding='utf-8') as f:
    code = f.read()

script = f"""async (page) => {{
  const codeContent = {json.dumps(code)};

  // 1. Check monaco
  const res = await page.evaluate((code) => {{
    if (window.monaco && monaco.editor) {{
      const models = monaco.editor.getModels();
      if (models && models.length > 0) {{
        models[0].setValue(code);
        return {{ success: true, count: models.length }};
      }}
    }}
    return {{ success: false }};
  }}, codeContent);

  if (!res.success) {{
    const editor = page.locator('.monaco-editor').first();
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.evaluate((code) => {{
      document.execCommand('insertText', false, code);
    }}, codeContent);
  }}

  // Press Ctrl+S to save
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(2000);
  
  await page.screenshot({{ path: 'C:/Users/maruf/Downloads/NFT/apps_script_saved.png' }});
  return 'Code successfully saved in Apps Script editor!';
}}"""

with open('update_editor_script.js', 'w', encoding='utf-8') as f:
    f.write(script)

print("Generated update_editor_script.js")
