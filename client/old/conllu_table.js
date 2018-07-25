'use strict'

function buildTable() {
    log.debug(`called buildTable()`);

    $('#table-data tbody').empty();

    $.each($('#text-data').val().split('\n'), (i, line) => {
        log.debug(`buildTable() line: ${line}`);
        if (line.trim() === '')
            return

        const cells = line.split('\t');
        let tr = $('<tr>').attr('id', `table_${i}`);

        if (line.startsWith('#')) {

            tr.addClass('comment').text(line);

        } else if (cells.length !== 10) {

            log.warn(`buildTable(): CoNLL-U should have 10 columns`);
            tr.addClass('wrong-shape').text(line);

        } else {

            $.each(cells, (j, cell) => {
                let valid = {},
                    td = $('<td>'),
                    inputSpan = $('<span>').attr('name', 'input'),
                    errorSpan = $('<span>').attr('name', 'error');

                if (cell.trim() === '')
                    cell = '_';

                if (cell !== '_') {
                    if (j === 3)
                        valid = is_upos(cell);
                    if (j === 7)
                        valid = is_udeprel(cell);
                }

                td.prop('contenteditable', true)
                    .attr('row-id', i)
                    .attr('col-id', j)
                    .attr('name', j === 0 ? 'index' : 'content')
                    .css('visibility', a.column_visible(j) ? 'visible' : 'hidden')
                    .blur(onEditTable)
                    .keyup((event) => {
                        if (event.which === KEYS.ESC) {
                            $(event.target).blur();
                        } else if (event.which === KEYS.ENTER) {
                            onEnter(event);
                        }
                    });

                inputSpan.text(cell);

                if (valid.err) {
                    log.warn(`buildTable(): error parsing cell (err:"${valid.err}", cell:"${cell}")`);
                    document.l10n.formatValue(valid.err, valid.data).then( (title) => {
                        errorSpan.addClass('fa fa-exclamation-triangle')
                            .addClass('parse-error')
                            .attr('aria-hidden', 'true')
                            .attr('title', title);
                    });
                }
                tr.append( td.append(inputSpan).append(errorSpan) );
            });
        }
        $('#table-data tbody').append(tr);
    });
}

function onEditTable(event) {
    log.debug(`called onEditTable(key: ${event.which})`);

    // join the rows on \n and the columns on \t
    let conllu = Array.from($('#table-data tr').map((i, tr) => {
        if ($(tr).hasClass('comment') || $(tr).hasClass('wrong-shape')) {

            return $(tr).text();

        } else {

            return Array.from($(tr).find('td').map((j, td) => {
                let content = $(td).find('[name=input]')
                    .text().replace(/<br>/g, '').trim();
                return content.length ? content : '_';

            })).join('\t');
        }
    })).join('\n');

    // save it to the textarea and parse it
    a.parse(conllu);
}

function toggleTable(event, force) { // force param used for testing
    log.debug('called toggleTable()');

    if (a.format !== 'CoNLL-U') {
        log.warn(`toggleTable(): table view not supported for ${a.format}`);
        a.is_table_view = false;
    } else {
        a.is_table_view = (force === undefined ? !a.is_table_view : force);
    }

    updateGui();
}

function toggleTableColumn(event) {
    log.debug(`called toggleTableColumn(col-id: ${$(event.target).attr('col-id')})`);

    const target = $(event.target), col = target.attr('col-id');
    if (target.find('i').length === 0) {
        log.warn(`toggleTableColumn(): `)
    }

    a.column_visible(col, !a.column_visible(col));
    target.toggleClass('column-hidden')
        .find('i')
            .toggleClass('fa-angle-double-right')
              .toggleClass('fa-angle-double-left');
    $(`td[col-id=${col}]`).css('visibility', a.column_visible(col) ? 'visible' : 'hidden');
}