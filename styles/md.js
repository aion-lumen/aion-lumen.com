(function () {
  'use strict';

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function inlineMd(text) {
    var out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return out;
  }

  function parseTable(lines, idx) {
    if (idx + 2 >= lines.length) return null;
    if (lines[idx].indexOf('|') === -1 || lines[idx + 1].indexOf('|') === -1) return null;
    if (!/^\s*\|?[\s:-|]+\|?\s*$/.test(lines[idx + 1])) return null;

    function splitRow(row) {
      var t = row.trim();
      if (t.startsWith('|')) t = t.slice(1);
      if (t.endsWith('|')) t = t.slice(0, -1);
      return t.split('|').map(function (c) { return c.trim(); });
    }

    var headers = splitRow(lines[idx]);
    var body = [];
    var i = idx + 2;
    while (i < lines.length && lines[i].indexOf('|') !== -1 && lines[i].trim() !== '') {
      body.push(splitRow(lines[i]));
      i++;
    }

    var html = '<table><thead><tr>';
    headers.forEach(function (h) { html += '<th>' + inlineMd(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    body.forEach(function (row) {
      html += '<tr>';
      row.forEach(function (c) { html += '<td>' + inlineMd(c) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return { html: html, next: i };
  }

  window.renderMarkdown = function renderMarkdown(md) {
    var lines = md.replace(/\r\n/g, '\n').split('\n');
    var i = 0;
    var html = '';

    while (i < lines.length) {
      var line = lines[i];
      var trim = line.trim();

      if (!trim) {
        i++;
        continue;
      }

      if (trim === '---' || trim === '***') {
        html += '<hr />';
        i++;
        continue;
      }

      var table = parseTable(lines, i);
      if (table) {
        html += table.html;
        i = table.next;
        continue;
      }

      if (trim.startsWith('```')) {
        var lang = trim.slice(3).trim();
        var code = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          code.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        html += '<pre><code' + (lang ? ' class="language-' + escapeHtml(lang) + '"' : '') + '>'
          + escapeHtml(code.join('\n')) + '</code></pre>';
        continue;
      }

      var heading = trim.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        var lvl = heading[1].length;
        html += '<h' + lvl + '>' + inlineMd(heading[2].trim()) + '</h' + lvl + '>';
        i++;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        html += '<blockquote><p>' + inlineMd(quote.join(' ')) + '</p></blockquote>';
        continue;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        var ul = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          ul.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
        }
        html += '<ul>' + ul.map(function (x) { return '<li>' + inlineMd(x.trim()) + '</li>'; }).join('') + '</ul>';
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        var ol = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          ol.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        html += '<ol>' + ol.map(function (x) { return '<li>' + inlineMd(x.trim()) + '</li>'; }).join('') + '</ol>';
        continue;
      }

      var para = [trim];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s+|```|>\s?|[-*]\s+|\d+\.\s+)/.test(lines[i].trim())) {
        para.push(lines[i].trim());
        i++;
      }
      html += '<p>' + inlineMd(para.join(' ')) + '</p>';
    }

    return html;
  };
})();
