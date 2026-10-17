# 🛡️ Kara Office: Windows SmartScreen Guide

Kara Office is distributed as a self-built installer. Because it does not yet carry a paid
code-signing certificate, Windows SmartScreen may show "Windows protected your PC".

## What to do (end user)
1. Click **More info** on the SmartScreen dialog.
2. Click **Run anyway**.
3. The installer and app are fully safe: they contain only the Kara Office suite built from your own source code.

## Why this happens
SmartScreen flags any unsigned executable, regardless of content. It is a reputation system, not a malware verdict.

## Roadmap
A code-signing certificate (OV or EV) removes this warning permanently and is tracked as a V2.3 trust item.
