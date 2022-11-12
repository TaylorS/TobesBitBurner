/** @param {NS} ns */
export async function main(ns) {
    ns.clearLog();
    ns.tail();

    const flags = ns.flags([
        ['help', false],
        ['collapse_all', false],
    ]);

    const main_scripts = [
        {
            title: '/stocks/market-burner.js',
            column: 3,
            display: 'fill'
        },
        {
            title: 'blade-runner.js',
            column: 3,
            display: 'fill'
        },
        {
            title: 'gang-runner.js',
            column: 2,
            display: 'fill'
        }
    ]

    let terminal_boundary = getTerminalBoundingRect();
    let tail_grid = getTailGrid(terminal_boundary)

    const all_processes = ns.ps()
    for (const process of all_processes) {
        const grid_info = main_scripts.find(script => script.title === process.filename)
        if (typeof grid_info !== 'undefined') {
            if (flags.collapse_all) {
                const tailWindow = getTailElementByTitle(process.filename)
                isTailMinimized(tailWindow, true)
            }
            tail_grid = placeInGrid(tail_grid, process, grid_info.column)
        } else {
            const tailWindow = getTailElementByTitle(process.filename)
            isTailMinimized(tailWindow, true)
            tail_grid = placeInGrid(tail_grid, process, 1)
        }
    }
    rearrangeGrid(ns, tail_grid)
}

export function autocomplete() {
    return ['--help', '--collapse_all'];
}

function isTailMinimized(tailWindow, minimize=false) {
    if (typeof tailWindow !== 'undefined') {
        const minBtn = tailWindow.querySelectorAll('[class*=MuiButton-root]')[1]
        if (minBtn.innerText === '🗕') {
            if (minimize) {
                minBtn.click()
                return true
            }
        } else {
            return true
        }
    }
    return false
}

function getTerminalBoundingRect(padding = 3) {
    let doc = eval("document");
    let return_boundary = {
        bottom: null,
        height: null,
        left: null,
        right: null,
        top: null,
        width: null,
        x: null,
        y: null
    };
    
    let reference_boundary = null;

    // Get terminal window element or root element if terminal is not visible
    let base_element = document.querySelector("#terminal-input")
    if (base_element === null) {
        // No terminal visible, use root instead
        base_element = document.querySelector("#root")
        reference_boundary = base_element.getBoundingClientRect()
    } else {
        base_element = base_element.parentNode.parentNode.parentNode.parentNode
        // Terminal input visible, use the top level terminal element
        // Terminal extends way past the input, trim it to fit above input
        reference_boundary = base_element.getBoundingClientRect()
        // Keep input visible
        let terminal_input = [...doc.querySelectorAll('[class*=MuiFormControl-root]')].pop();
        let input_bounds = terminal_input.getBoundingClientRect()
        return_boundary.bottom = input_bounds.y
        return_boundary.height = input_bounds.y
        return_boundary.y = input_bounds.y
    }

    return_boundary.bottom = ((return_boundary.bottom === null) ? reference_boundary.bottom : return_boundary.bottom) - padding;
    return_boundary.height = ((return_boundary.height === null) ? reference_boundary.height : return_boundary.height) - (padding * 2);
    return_boundary.left = reference_boundary.left + padding; 
    return_boundary.right = reference_boundary.right - padding;
    return_boundary.top = 0; 
    return_boundary.width = reference_boundary.width - (padding * 2);
    return_boundary.x = reference_boundary.x + padding;
    return_boundary.y = ((return_boundary.y === null) ? reference_boundary.y : return_boundary.y) - padding;

    return return_boundary;
}

function getBoundingRect(title, padding = 0) {
    // Get terminal window element
    let tail_ele = getTailElementByTitle(title)
    let tail_bounds = tail_ele.getBoundingClientRect()

    return {
        bottom: tail_bounds.bottom - padding,
        height: tail_bounds.height - padding * 2,
        left: tail_bounds.left + padding,
        right: tail_bounds.right - padding,
        top: tail_bounds.top + padding,
        width: tail_bounds.width - padding * 2,
        x: tail_bounds.x + padding,
        y: tail_bounds.y - padding
    }
}

function getTailGrid(boundary) {
    let column_width = boundary.width * (1 / 4)
    const col0 = {
        width: column_width,
        height: boundary.height,
        top: boundary.top,
        bottom: boundary.bottom,
        left: boundary.left,
        right: boundary.left + column_width,
        is_full: false,
        elements: []
    }
    const col1 = {
        width: column_width,
        height: boundary.height,
        top: boundary.top,
        bottom: boundary.bottom,
        left: col0.right,
        right: col0.right + column_width,
        is_full: false,
        elements: []
    }

    const col2 = {
        width: column_width,
        height: boundary.height,
        top: boundary.top,
        bottom: boundary.bottom,
        left: col1.right,
        right: col1.right + column_width,
        is_full: false,
        elements: []
    }

    const col3 = {
        width: column_width,
        height: boundary.height,
        top: boundary.top,
        bottom: boundary.bottom,
        left: col2.right,
        right: col2.right + column_width,
        is_full: false,
        elements: []
    }

    return [col0, col1, col2, col3]
}

function placeInGrid(grid, element, column) {
    grid[column].elements.push(element);
    return grid;
}

/** @param {NS} ns */
function rearrangeGrid(ns, grid, column = null) {
    if (column === null) {
        for (let i = 0; i < grid.length; i++) {
            rearrangeColumn(ns, grid, i)
        }
    } else {
        rearrangeColumn(ns, grid, i)
    }
}

/** @param {NS} ns */
function rearrangeColumn(ns, grid, column) {
    const total_element_count = grid[column].elements.length;
    const elementHeight = grid[column].height / total_element_count

    let current_element_count = 0;
    for (const ele of grid[column].elements) {
        const tailWindow = getTailElementByTitle(ele.filename)

        if (!(isTailMinimized(tailWindow, false))) {
            const elementTop = elementHeight * current_element_count
            ns.resizeTail(grid[column].width, elementHeight, ele.pid)
            ns.moveTail(grid[column].left, elementTop, ele.pid)
        } else {
            const eleBoundary = getBoundingRect(ele.filename)
            const elementTop = eleBoundary.height * current_element_count
            ns.resizeTail(grid[column].width, eleBoundary.height, ele.pid)
            ns.moveTail(grid[column].left, elementTop, ele.pid)
        }
        current_element_count += 1;
    }
}

function getTailElementByTitle(title) {
    let doc = eval("document");
    for (let draggable_container of [...doc.querySelectorAll(".react-draggable")]) {
        let tail_title = draggable_container.firstChild.firstChild.firstChild.getAttribute('title');
        if (tail_title == null) { continue; }
        if (tail_title.trim() == title) {
            return draggable_container
        }
    }
}