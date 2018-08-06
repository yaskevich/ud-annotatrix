'use strict';

const _ = require('underscore');
const $ = require('jquery');

const KEYS = {
  DELETE: 46,
  BACKSPACE: 8,
  ENTER: 13,
  ESC: 27,
  TAB: 9,
  RIGHT: 39,
  LEFT: 37,
  UP: 38,
  DOWN: 40,
  MINUS: 173,
  MINUS_: 189,
  EQUALS: 61,
  EQUALS_: 187,
  SHIFT: 16,
  CTRL: 17,
  OPT: 18,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  META: 224,
  C: 67,
  D: 68,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  P: 80,
  R: 82,
  S: 83,
  X: 88,
  Y: 89,
  Z: 90,
  0: 48,
  QUESTION_MARK: 191,
};

var pressed = new Set();

function name(which) {
  return _.invert(KEYS)[which];
}

function keyup(app, event) {

  const corpus = app.corpus,
    graph = app.graph,
    gui = app.gui;

  pressed.delete(event.which);
  console.log('keyup>', event.which, name(event.which) || event.key, pressed)

  // catch CTRL+<key> sequence first
  if (pressed.has(KEYS.CTRL)) {

    if (event.which === KEYS.PAGE_DOWN) {
      if (pressed.has(KEYS.SHIFT)) {
        corpus.last();
      } else {
        corpus.next();
      }
      return;

    } else if (event.which === KEYS.PAGE_UP) {
      if (pressed.has(KEYS.SHIFT)) {
        corpus.first()
      } else {
        corpus.prev()
      }
      return;

    } else if (event.which === KEYS.Z && !pressed.has(KEYS.SHIFT)) {
      undoManager.undo();
      return;

    } else if (event.which === KEYS.Y || pressed.has(KEYS.Z)) {
      undoManager.redo();
      return;

    } else if (event.which === KEYS.L) {
      $('#label-input').focus();
      return;

    } else if (47 < event.which && event.which < 58) { // key in 0-9

      const num = event.which - 48;
      graph.graph.cy.zoom(1.5 ** (num - 5));
      gui.refresh();
      return;

    }
  }

  if ($(':focus').is('.conllu-table')) {

    const table = gui.table;
    const td = $(':focus');

    switch (event.which) {
      case (KEYS.ENTER):
        table.toggleEditing();
        return;

      case (KEYS.TAB):
        if (pressed.has(KEYS.SHIFT)) {
          table.goLeft(true);
          table.toggleEditing(true);
        } else {
          table.goRight(true);
          table.toggleEditing(true);
        }
        return;

      case (KEYS.UP):
        if (!table.editing)
          table.goUp();
        return;

      case (KEYS.DOWN):
        if (!table.editing)
          table.goDown();
        return;

      case (KEYS.LEFT):
        if (!table.editing)
          table.goLeft();
        return;

      case (KEYS.RIGHT):
        if (!table.editing)
          table.goRight();
        return;

      case (KEYS.ESC):
        const originalValue = td.attr('original-value') || '';
        td.text(originalValue).blur();
        return;
    }
  }

  if ($(':focus').is('#current-sentence')) {

    switch (event.which) {
      case (KEYS.ENTER):
        corpus.index = parseInt($('current-sentence').val()) - 1;
        return;

      case (KEYS.LEFT):
      case (KEYS.J):
        corpus.prev();
        return;

      case (KEYS.RIGHT):
      case (KEYS.K):
        corpus.next();
        return;

      case (KEYS.MINUS):
        corpus.removeSentence();
        return;

      case (KEYS.EQUALS):
        corpus.insertSentence();
        return;
    }
  }

  if ($(':focus').is('#edit')) {

    switch (event.which) {
      case (KEYS.ENTER):
        app.graph.intercepted = false;
        graph.clear();
        return;

      case (KEYS.TAB):
        graph.intercepted = false;
        if (pressed.has(KEYS.SHIFT)) {
          graph.prev();
        } else {
          graph.next();
        }
        return;

      case (KEYS.ESC):
        app.graph.intercepted = false;
        app.graph.editing = null;
        graph.clear();
        return;
    }
  }

  if ($(':focus').is('#text-data')) {

    switch (event.which) {
      case (KEYS.ESC):
        this.blur();
        return;

      case (KEYS.ENTER):
        console.log('onEnter() not implemented');//onEnter(event);
        return;

      case (KEYS.TAB):

        const cursor = $('#text-data').prop('selectionStart'),
          contents = $('#text-data').val(),
          before = contents.substring(0, cursor),
          after = contents.substring(cursor, contents.length);

        $('#text-data').val(before + '\t' + after);
        return;

      default:
        // wait a full second before parsing (this prevents immediate trimming
        //   of whitespace and other annoying side effects), and avoid redundant
        //   parsing if we edit again w/in that 1-sec window
        clearTimeout(gui.parseTimer);
        gui.parseTimer = setTimeout(() => {

          if (corpus.parsed) {
            corpus.parse($('#text-data').val());
          } else {
            corpus.current._meta.unparsed = $('#text-data').val();
          }

        }, 1000);
        return;
    }
  }

  if (event.which === KEYS.QUESTION_MARK) {
    console.log('help modal not implemented :(');
    return;
  }

  if (graph.cy)
    switch (event.which) {
      case (KEYS.DELETE):
      case (KEYS.BACKSPACE):
      case (KEYS.X):
        if (graph.cy.$('.selected').length) {
          graph.removeDependency(graph.cy.$('.selected'));
        }/* else if (graph.cy.$('.supAct').length) {
          removeSup(st);
        }*/
        return;

      case (KEYS.D):
        if (graph.cy.$('.selected').length) {
          graph.cy.$('.selected').toggleClass('moving');
          graph.moving_dependency = !graph.moving_dependency;
        }
        return;

      case (KEYS.P):
        /* if (text not focused)
          setPunct();*/
        console.log('setPunct() not implemented');
        return;

      case (KEYS.R):
        if (graph.cy.$('node.form.activated'))
          graph.setRoot(graph.cy.$('node.form.activated'));
        return;

      case (KEYS.S):

        const token = graph.cy.$('.activated');
        const superToken = graph.cy.$('.multiword-active');

        if (token.length) {

          graph.flashTokenSplitInput(token);

        } else if (superToken.length) {

          graph.splitSuperToken(superToken);

        }
        gui.status.refresh();
        return;

      case (KEYS.M):

        if (graph.cy.$('.merge-source').length) {

          graph.cy.$('.neighbor')
            .removeClass('merge-left merge-right neighbor');

          graph.cy.$('.merge-source')
            .removeClass('merge-source')
            .addClass('activated');

        } else if (graph.cy.$('.activated').length) {

          if (graph.cy.$('.activated').data('type') !== 'token')
            return;

          graph.cy.$('.activated')
            .addClass('merge-source');

          graph.cy.$('.neighbor')
            .removeClass('neighbor combine-source combine-left combine-right')

          const left = graph.getLeftForm();
          if (!left.hasClass('activated') && left.data('type') === 'token')
            left
              .addClass('neighbor')
              .addClass('merge-left');

          const right = graph.getRightForm();
          if (!right.hasClass('activated') && right.data('type') === 'token')
            right
              .addClass('neighbor')
              .addClass('merge-right');

        }
        gui.status.refresh();
        return;

      case (KEYS.C):
        if (graph.cy.$('.combine-source').length) {

          graph.cy.$('.neighbor')
            .removeClass('combine-left combine-right neighbor');

          graph.cy.$('.combine-source')
            .removeClass('combine-source')
            .addClass('activated');

        } else if (graph.cy.$('.activated').length) {

          if (graph.cy.$('.activated').data('type') !== 'token')
            return;

          graph.cy.$('.activated')
            .addClass('combine-source');

          graph.cy.$('.neighbor')
            .removeClass('neighbor merge-source merge-left merge-right')

          const left = graph.getLeftForm();
          if (!left.hasClass('activated') && left.data('type') === 'token')
            left
              .addClass('neighbor')
              .addClass('combine-left');

          const right = graph.getRightForm();
          if (!right.hasClass('activated') && right.data('type') === 'token')
            right
              .addClass('neighbor')
              .addClass('combine-right');

        }
        gui.status.refresh();
        return;

      case (KEYS.LEFT):

        // avoid panning the window
        if (event.preventDefault)
          event.preventDefault();

        if (graph.cy.$('.merge-left').length) {

          const src = graph.cy.$('.merge-source').data('token');
          const tar = graph.cy.$('.merge-left').data('token');
          graph.merge(src, tar);

        } else if (graph.cy.$('.combine-left').length) {

          const src = graph.cy.$('.combine-source').data('token');
          const tar = graph.cy.$('.combine-left').data('token');
          graph.combine(src, tar);

        }
        return;

      case (KEYS.RIGHT):

        // avoid panning the window
        if (event.preventDefault)
          event.preventDefault();

          if (graph.cy.$('.merge-right').length) {

            const src = graph.cy.$('.merge-source').data('token');
            const tar = graph.cy.$('.merge-right').data('token');
            graph.merge(src, tar);

          } else if (graph.cy.$('.combine-right').length) {

            const src = graph.cy.$('.combine-source').data('token');
            const tar = graph.cy.$('.combine-right').data('token');
            graph.combine(src, tar);

          }
        return;

      case (KEYS.EQUALS):
      case (KEYS.EQUALS_):
        if (event.shiftKey) {
          graph.zoomIn();
        } else {
          graph.cy.fit().center();
        }
        return;

      case (KEYS.MINUS):
      case (KEYS.MINUS_):
        if (event.shiftKey) {
          graph.zoomOut();
        } else {
          graph.cy.fit().center();
        }
        return;

      case (KEYS.ENTER):
        graph.intercepted = false;
        graph.clear();
        return;

      case (KEYS.ESC):
        graph.clear();
        return;

    }

}

function keydown(app, event) {

  pressed.add(event.which);
  if (event.which === KEYS.TAB)
    event.preventDefault();

  if (event.which === KEYS.ENTER && $(':focus').is('td'))
    event.preventDefault();
}

module.exports = KEYS;
module.exports.pressed = pressed;
module.exports.up = keyup;
module.exports.down = keydown;


/*



function onEnter(event) {
  log.debug(`called onEnter()`);

  let sentence = $('#text-data').val(),
    cursor = $('#text-data').prop('selectionStart') - 1,
    lines = sentence.split(/\n/),
    lineId = null, before, during, after,
    cursorLine = 0;

  if (gui.is_table_view) {

    const target = $(event.target);
    cursor = parseInt(target.attr('row-id')) || parseInt(target.attr('col-id'));
    cursorLine = target.attr('row-id');

  } else {

    if (manager.format === 'Unknown' || manager.format === 'plain text')
      return;

    // get current line number
    let acc = 0;
    $.each(lines, (i, line) => {
      acc += line.length;
      if (acc + i < cursor)
        cursorLine = i + 1;
    });
    log.debug(`onEnter(): cursor on line[${cursorLine}]: "${lines[cursorLine]}"`);

    // advance the cursor until we are at the end of a line that isn't followed by a comment
    //   or at the very beginning of the textarea
    if (cursor !== 0 || sentence.startsWith('#')) {
      log.debug(`onEnter(): cursor[${cursor}]: "${sentence[cursor]}" (not at textarea start OR textarea has comments)`)
      while (sentence[cursor + 1] === '#' || sentence[cursor] !== '\n') {
        log.debug(`onEnter(): cursor[${cursor}]: "${sentence[cursor]}", line[${cursorLine}]: ${lines[cursorLine]}`);
        if (cursor === sentence.length)
          break;
        if (sentence[cursor] === '\n')
          cursorLine++;
        cursor++;
      }
    } else {
      log.debug(`onEnter(): cursor[${cursor}]: "${sentence[cursor]}" (at textarea start)`)
      cursorLine = -1;
    }
  }

  log.debug(`onEnter(): cursor[${cursor}]: "${sentence[cursor]}", line[${cursorLine}]: ${lines[cursorLine]}`);

  if (event.preventDefault) // bc of testing, sometimes these are fake events
    event.preventDefault();

  switch (manager.format) {
    case ('CoNLL-U'):

      throw new Error('deprecated');
      if (cursor) {
        const tabs = lines[cursorLine].split('\t');
        const token = manager.current.getById(tabs[0]).token;
        manager.current.insertTokenAfter(token);

      } else {
        const token = manager.current[0].token;
        manager.current.insertTokenBefore(token);
      }

      // parse but persist the table settings
      const is_table_view = manager.current.is_table_view;
      const column_visibilities = manager.current.column_visibilities;
      manager.parse(manager.conllu);
      manager.current.is_table_view = is_table_view;
      manager.current.column_visibilities = column_visibilities;

      break;

    case ('CG3'):

      throw new errors.NotImplementedError('can\'t onEnter with CG3 :/');*/
      /*
      // advance to the end of an analysis
      log.debug(`onEnter(): line[${cursorLine}]: "${lines[cursorLine]}", cursor[${cursor}]: "${sentence[cursor]}"`);
      while (cursorLine < lines.length - 1) {
          if (lines[cursorLine + 1].startsWith('"<'))
              break;
          cursorLine++;
          cursor += lines[cursorLine].length + 1;
          log.debug(`onEnter(): incrementing line[${cursorLine}]: "${lines[cursorLine]}", cursor[${cursor}]: "${sentence[cursor]}"`);
      }

      lineId = lines.slice(0, cursorLine + 1).reduce((acc, line) => {
          return acc + line.startsWith('"<');
      }, 0) + 1;
      log.debug(`onEnter(): inserting line with id: ${lineId}`);
      log.debug(`onEnter(): resetting all content lines: [${lines}]`);

      const incrementIndices = (lines, lineId) => {
        return lines.map((line) => {
          if (line.startsWith('#'))
            return line;
          (line.match(/[#>][0-9]+/g) || []).map((match) => {
            let id = parseInt(match.slice(1));
            id += (id >= lineId ? 1 : 0);
            line = line.replace(match, `${match.slice(0,1)}${id}`)
          });
          return line;
        });
      }
      before = incrementIndices(lines.slice(0, cursorLine + 1), lineId);
      during = [`"<_>"`, `\t${getCG3Analysis(lineId, {id:lineId})}`];
      after = incrementIndices(lines.slice(cursorLine + 1), lineId);

      log.debug(`onEnter(): preceding line(s) : [${before}]`);
      log.debug(`onEnter(): interceding lines : [${during}]`);
      log.debug(`onEnter(): proceeding line(s): [${after}]`);

      $('#text-data').val(before.concat(during, after).join('\n'))
        .prop('selectionStart', cursor)
        .prop('selectionEnd', cursor);*/

        /*

      break;

    default:
      insertSentence();
  }

  gui.refresh();
}

*/