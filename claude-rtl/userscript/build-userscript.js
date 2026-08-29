#!/usr/bin/env node
/* Wraps the bundle in a Tampermonkey/Violentmonkey header. */
const fs = require('fs');
const path = require('path');

const bundle = fs.readFileSync(
  path.join(__dirname, '..', 'dist', 'claude-rtl.bundle.js'), 'utf8');

const header = `// ==UserScript==
// @name         Claude RTL — Hebrew & Arabic
// @namespace    https://github.com/770m770h/770m770h
// @version      1.0.0
// @description  Right-to-left rendering for Hebrew/Arabic in Claude, including lines that mix in English words.
// @author       770m770h
// @match        https://claude.ai/*
// @match        https://*.claude.ai/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

`;

const out = path.join(__dirname, 'claude-rtl.user.js');
fs.writeFileSync(out, header + bundle);
console.log('built ' + path.relative(process.cwd(), out));
