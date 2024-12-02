document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("aside nav a");
    const titles = document.querySelectorAll(".title h1");
    const addTaskButton = document.getElementById('addTaskButton');
    const searchInput = document.getElementById('search-input');
    const searchInputMobile = document.getElementById('search-mobile');
    const todoFlag = document.querySelector(".flagged-todo");
    const goBackButton = document.getElementById('goBackButton');
    const allNavButton = document.getElementById('allNav');
    const todoList = document.querySelectorAll(".todos");
    let taskParagraph = document.createElement('p');
    const dateSpan = document.querySelector(".date-span");
    const allListsOl = document.querySelector('ol.todos');
    const allTodosContainer = document.querySelector(".todos.all");
    const flaggedTodosContainer = document.querySelector(".todos.flagged");
    const aside = document.querySelector("aside");
    const main = document.querySelector("main");


    const all = 'all';
    const flagged = 'flagged';
    const today = 'today';
    const scheduled = 'scheduled';
    const activeFlag = 'activeFlag';

    const dateErrorMessage = 'Dátum je neplatný. Použite formát DD.MM.YYYY.';

    let currentTodoList;

    searchInput.addEventListener('focus', () => {
        // ked kliknem na search hodi ma do ALL ktore idem prehladavat
        allNavButton.click();
        if (isFroPhones()) {
            // ak mam obrazovku pre telefony spravim si focus na search input v zozname
            searchInputMobile.focus();
            searchInputMobile.setSelectionRange(searchInputMobile.value.length, searchInputMobile.value.length);
        }
    });

    // vyhladavanie
    searchInput.addEventListener('input', () => {
        displayWantedTasks(allTodosContainer, searchInput.value, all)
    });

    // vyhladavanie pre mobil
    searchInputMobile.addEventListener('input', () => {
        displayWantedTasks(allTodosContainer, searchInputMobile.value)
    });

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            searchInput.value = '';
            const targetClass = link.className;

            if (targetClass.includes('active')) {
                return;
            }

            titles.forEach(title => {
                if (title.classList.contains(targetClass)) {
                    title.style.display = "block";
                } else {
                    title.style.display = "none";
                }
            });
            // Zobraziť/zastaviť tituly a zmeniť aktívny odkaz
            todoList.forEach(title => {
                if (title.classList.contains(targetClass)) {
                    title.style.display = "block";
                } else {
                    title.style.display = "none";
                }
            });

            // Uprav aktívny odkaz
            navLinks.forEach(link => link.classList.remove("active"));
            link.classList.add("active");

            // Nastav aktuálny zoznam úloh
            currentTodoList = document.querySelector(`.todos.${targetClass}`);

            if (targetClass === all || targetClass === flagged) {
                // Ak je cieľom zoznam "all", zobraz všetky úlohy zo všetkých zoznamov
                displayWantedTasks(allTodosContainer);
                if (isFroPhones()) {
                    searchInputMobile.style.display = "block";
                }
                const container = targetClass === all ? allTodosContainer : flaggedTodosContainer;
                displayWantedTasks(container, undefined, targetClass);
                addTaskButton.disabled = true;
            } else {
                searchInputMobile.style.display = "none";
                // disablneme tlacidlo ak som flagged alebo all
                addTaskButton.disabled = false;
            }
            onlyMain()
        });
    });

    goBackButton.addEventListener('click', function () {
        onlyAside();
    });

    // Pridaj úlohu do aktuálneho viditeľného zoznamu
    addTaskButton.addEventListener('click', function () {
        addReminder();
    });

    // Pridaj úlohu do aktuálneho viditeľného zoznamu
    allListsOl.addEventListener('click', function () {
        if (isFroPhones()) {
            addReminder();
        }
    });

    loadTasks(); // Načítaj úlohy po načítaní stránky

    function isFroPhones() {
        const mediaQuery = window.matchMedia("(max-width: 580px)");

        return mediaQuery.matches
    }

    function onlyMain() {
        if (isFroPhones()) {
            main.classList.remove('hidden');
            aside.classList.add('hidden');

            setTimeout(() => {
                main.style.display = "block";
                aside.style.display = "none";
            }, 150); // Čas by mal byť rovnaký ako dĺžka tranzície v CSS
        } else {
            showBooth();
        }
    }

    function onlyAside() {
        if (isFroPhones()) {
            main.classList.add('hidden');
            aside.classList.remove('hidden');

            setTimeout(() => {
                main.style.display = "none";
                aside.style.display = "block";
            }, 150); // Čas by mal byť rovnaký ako dĺžka tranzície v CSS
        } else {
            showBooth();
        }
    }

    function showBooth() {
        if (isFroPhones()) {
            main.style.display = "block";
            aside.style.display = "block";
        }
    }

    function cloneTask(task, relevantClass, container) {
        const taskClone = task.cloneNode(true);

        // Nastavíme unikátny `data-id` atribút pre každú úlohu
        const taskId = task.dataset.id || Date.now() + Math.random();
        task.dataset.id = taskId;
        taskClone.dataset.id = taskId;
        // pridavame a zistujeme classu aby sme vedeli v zozname all rozlisit tasky z akeho su zoznamu
        taskClone.className = relevantClass + 'Reminder';

        // Pridaj event listener na odstránenie úlohy
        const svg = taskClone.querySelector("svg");
        svg.addEventListener("click", function () {
            removeTaskFromAllLists(taskId);
            countNumberOfReminders();
            saveTasks();
        });

        // Pridaj event listener na odstránenie úlohy
        const svg1 = taskClone.querySelector('.flagged-todo');
        svg1.addEventListener("click", function () {
            unflagTaskFromAllLists(taskId)
            countNumberOfReminders();
            saveTasks();
        });

        container.appendChild(taskClone);
    }

    function allTaskShow(search, task, relevantClass, container) {
        if (search == null) {
            cloneTask(task, relevantClass, container);
        } else if (task.innerText.includes(search)) {
            cloneTask(task, relevantClass, container);
        }
    }

    function flaggedTaskShow(search, task, relevantClass, container) {
        const svgElements = task.querySelectorAll('svg');
        svgElements.forEach(svg => {
            if (svg.classList.contains(activeFlag)) {
                cloneTask(task, relevantClass, container);
            }
        });
    }

    function displayWantedTasks(container, search, nav) {
        container.innerHTML = "";

        const todoLists = document.querySelectorAll(".todos:not(.all):not(.flagged)");

        todoLists.forEach(todoList => {
            // Získaj triedy (class) z aktuálneho elementu
            const classes = Array.from(todoList.classList); // Prevedieme classList na pole
            // Pridaj poslednú triedu do poľa
            const relevantClass = classes.find(className => className !== 'todos');
            const tasks = todoList.querySelectorAll("li");

            tasks.forEach(task => {
                if (nav === all) {
                    allTaskShow(search, task, relevantClass, container);
                } else if (nav === flagged) {
                    flaggedTaskShow(search, task, relevantClass, container);
                }
            });
        });
    }


    function setReminderCounter(todoLists) {
        if (todoLists) {
            Object.keys(todoLists).forEach(className => {
                const id = className + 'NumberId';
                let numberOfReminders = todoLists[className].length;
                const navigationItem = document.querySelector('.navigation');
                const divElement = navigationItem.querySelector(`a.${className} > div`);

                const newSpanItem = document.createElement('span');
                if (className === all) {
                    numberOfReminders = countItemsExcludingAllAndFlagged(todoLists, ['all', 'flagged'])
                }

                if (className === flagged) {
                    numberOfReminders = countFlaggedItems(todoLists, ['all', 'flagged'])
                }
                newSpanItem.textContent = numberOfReminders;
                newSpanItem.id = id;

                const existingSpan = divElement.querySelector(`span#${id}`);

                if (existingSpan) {
                    existingSpan.remove();
                }

                divElement.appendChild(newSpanItem);
            });
            return;
        }
        // sluzi na prvotnu inicializaciu listov ked uzivatel prvy krat otvori stranku a nema este ulozene ziadne zoznamy
        // a teda setneme mu 0 lebo vsetky listy su prazdne :)
        countNumberOfReminders()

    }

    function countItemsExcludingAllAndFlagged(lists, excludeKeys) {
        return Object.keys(lists).reduce((total, key) => {
            // Ak kľúč nie je v poli výnimiek, sčíta dĺžku poľa
            return !excludeKeys.includes(key) ? total + lists[key].length : total;
        }, 0);
    }

    function countFlaggedItems(lists, excludeKeys) {
        return Object.keys(lists).reduce((total, key) => {
            // Skontroluj, či aktuálny kľúč nie je v poli výnimiek
            if (!excludeKeys.includes(key)) {
                // Sčítaj počet položiek s flagged === true
                total += lists[key].filter(item => item.flagged === true).length;
            }
            return total;
        }, 0);
    }

    function removeTaskFromAllLists(taskId) {
        // Odstráni úlohu zo všetkých zoznamov
        const allTasks = document.querySelectorAll(`[data-id="${taskId}"]`);
        allTasks.forEach(task => task.remove());
    }

    function unflagTaskFromAllLists(taskId) {
        // Odstráni úlohu zo všetkých zoznamov
        const allTasks = document.querySelectorAll(`[data-id="${taskId}"]`);
        allTasks.forEach(task => {
                const svg = task.querySelector('.flagged-todo');
                svg.classList.remove(activeFlag);
            }
        );

        const taskToRemove = flaggedTodosContainer.querySelectorAll(`[data-id="${taskId}"]`);
        taskToRemove.forEach(task => task.remove());
    }

    function getSvg() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('width', '2rem');
        svg.setAttribute('height', '2rem');
        return svg;
    }

    function getCircle() {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('r', '11');
        circle.setAttribute('cx', '16');
        circle.setAttribute('cy', '16');

        return circle;
    }

    function getSvgFlagged() {
        // Vytvorenie SVG elementu
        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute("class", "flagged-todo");

        // Vytvorenie PATH elementu
        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("stroke", "currentColor");
        pathElement.setAttribute("stroke-linecap", "round");
        pathElement.setAttribute("stroke-linejoin", "round");
        pathElement.setAttribute("stroke-width", "2");
        pathElement.setAttribute("d", "M5 14v7M5 4.971v9.541c5.6-5.538 8.4 2.64 14-.086v-9.54C13.4 7.61 10.6-.568 5 4.97Z");

        svgElement.appendChild(pathElement)
        return svgElement;
    }

    // Uloženie úloh
    function saveTasks() {
        const todoLists = getActualTodosLists();
        localStorage.setItem('todoLists', JSON.stringify(todoLists));
    }

    function addReminder() {
        if (!currentTodoList) {
            currentTodoList = document.querySelector('.todos.today'); // Ak je undefined, vyber predvolený
        }

        const taskParagraphs = currentTodoList.getElementsByTagName('p');
        const lastTask = taskParagraphs[taskParagraphs.length - 1];

        if (lastTask && lastTask.textContent.trim() === '') {
            alert('Prosím, dokončite poslednú úlohu pred pridaním novej.');
            lastTask.focus();
            return;
        }
        const currentListClass = currentTodoList.className.split(' ').find(c => c !== 'todos')
        const newTaskItem = createTaskItem(false, null, currentListClass);

        currentTodoList.appendChild(newTaskItem); // Pridaj do aktuálneho zoznamu
        saveTasks(); // Ulož po pridaní úlohy

        taskParagraph.focus();
        countNumberOfReminders();
    }

    function loadTasks() {

        const todoLists = JSON.parse(localStorage.getItem('todoLists'));

        if (todoLists) {
            moveTasksToTodayAndSort(todoLists)
            Object.keys(todoLists).forEach(className => {
                const listElement = document.querySelector(`.todos.${className}`);
                if (listElement) {
                    todoLists[className].forEach(task => {
                        const newTaskItem = createTaskItem(true, task);
                        listElement.appendChild(newTaskItem); // Pridaj do aktuálneho zoznamu
                    });
                }
            });
        }
        setReminderCounter(todoLists);
    }

    function moveTasksToTodayAndSort(taskLists) {
        // Prechádzame scheduled a presúvame vhodné úlohy do today
        for (let i = taskLists.scheduled.length - 1; i >= 0; i--) {
            const task = taskLists.scheduled[i];
            const taskDate = task.date;

            // Ak je dátum dnešný alebo starší
            if (isDateOlderThanTomorrow(taskDate)) {
                taskLists.today.push(task); // Presuň do today
                taskLists.scheduled.splice(i, 1); // Odstráň zo scheduled
            }
        }
        // Zoradenie today podľa dátumu
        taskLists.scheduled.sort((a, b) => formatInputDay(a.date) - formatInputDay(b.date));
        // Zoradenie today podľa dátumu
        taskLists.today.sort((a, b) => formatInputDay(a.date) - formatInputDay(b.date));
    }

    function isDateOlderThanToday(dateString) {
        const inputDate = formatInputDay(dateString)

        const today = new Date(); // Dnešný dátum
        today.setHours(0, 0, 0, 0); // Nastavenie času na začiatok dňa pre presné porovnanie
        return inputDate < today; // Porovnanie dátumov
    }

    function isDateOlderThanTomorrow(dateString) {
        const inputDate = formatInputDay(dateString)

        const tomorrow = new Date(); // Dnešný dátum
        tomorrow.setHours(0, 0, 0, 0); // Nastavenie času na začiatok dňa pre presné porovnanie
        tomorrow.setDate(tomorrow.getDate() + 1);
        return inputDate < tomorrow; // Porovnanie dátumov
    }

    function formatInputDay(dateString) {
        const [day, month, year] = dateString.split('.').map(Number); // Rozdelenie reťazca na deň, mesiac, rok
        return new Date(year, month - 1, day); // Vytvorenie objektu Date (mesiace sú indexované od 0)
    }

    function getDate(currentListClass) {
        const date = new Date();

        if (currentListClass === today) {
            return formatDate(date);
        }

        if (currentListClass === scheduled) {
            date.setDate(date.getDate() + 1);
            return formatDate(date);
        }

        return undefined;
    }

    function getDivDate(loadingTask, task, currentListClass) {
        const div = document.createElement('div');
        div.setAttribute("class", "span-box");
        div.appendChild(getSpanDate(loadingTask, task, currentListClass));
        div.appendChild(getPErrorMessage())
        return div;
    }

    function getSpanDate(loadingTask, task, currentListClass) {
        const span = document.createElement('span');
        span.contentEditable = true;

        if (task != null && task.date != null && loadingTask) {
            const date = task.date
            span.textContent = date;
            if (isDateOlderThanToday(date)) {
                span.setAttribute("class", "old-date");
            }
        } else {
            span.textContent = getDate(currentListClass);
        }
        span.classList.add("date-span");
        addAllEventListenersToSpan(span);
        return span;
    }

    function getPErrorMessage() {
        const p = document.createElement('p');
        p.setAttribute("class", "date-error");
        p.textContent = dateErrorMessage;
        return p;
    }

    function isValidDate(dateString) {
        // Regex na formát DD.MM.YYYY
        const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

        // Skontroluj základný formát
        if (!dateRegex.test(dateString)) {
            return false;
        }

        // Rozdelenie reťazca na deň, mesiac a rok
        const [day, month, year] = dateString.split('.').map(Number);

        // Skontroluj platnosť roka, mesiaca a dňa
        if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1) {
            return false;
        }

        // Počet dní v mesiaci
        const daysInMonth = new Date(year, month, 0).getDate();

        // Skontroluj, či deň nie je väčší ako maximálny počet dní v mesiaci
        return day <= daysInMonth;
    }


    function addAllEventListenersToSpan(span) {
        handleValidation(span);
        addCursorToEnd(span);
    }

    // Validácia po skončení úpravy
    function handleValidation(span) {
        span.addEventListener('blur', () => {
            const dateText = span.textContent.trim();
            const errorElement = span.nextElementSibling;

            if (dateText === '') {
                // Ak je obsah span prázdny, odstráni element
                console.log('Pole je prázdne, odstraňuje sa.');
                span.remove(); // Odstráni len samotný <span>, ak to preferuješ
            } else if (isValidDate(dateText)) {
                errorElement.style.display = 'none';
            } else {
                errorElement.style.display = 'block';
            }
        });
    }

    // Zabezpečí kurzor na konci pri úprave
    function addCursorToEnd(span) {
        span.addEventListener('focus', () => {
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(span);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        });
    }

    function createTaskItem(loadingTask, task, currentListClass) {
        const newTaskItem = document.createElement('li');

        const svg = getSvg();
        const circle = getCircle();
        const flag = getSvgFlagged();
        const date = getDivDate(loadingTask, task, currentListClass);

        svg.appendChild(circle);
        // Pridaj event listener na blur
        addBlurListener(newTaskItem);
        // Pridaj event listener na kliknutie SVG
        addSvgClickListener(svg, newTaskItem);
        addSvgFlagClickListener(flag, newTaskItem);

        taskParagraph = document.createElement('p');
        taskParagraph.contentEditable = true;
        if (loadingTask && task) {
            taskParagraph.textContent = task.text; // Načítanie textu úlohy
        }

        if (loadingTask && task && task.flagged) {
            addFlag(flag)
        }

        newTaskItem.appendChild(svg);
        newTaskItem.appendChild(taskParagraph);
        newTaskItem.appendChild(flag);
        newTaskItem.appendChild(date);
        return newTaskItem;
    }

    function getListName(list) {
        return list.className.split(' ').find(c => c !== 'todos');
    }

    function getActualTodosLists() {
        const todoLists = {};
        document.querySelectorAll('.todos').forEach((list) => {
            const listClass = getListName(list);
            todoLists[listClass] = Array.from(list.getElementsByTagName('li')).map(li => {
                const p = li.querySelector('p');
                const span = li.querySelector('.span-box span');
                return {
                    text: p.textContent,
                    completed: li.querySelector('svg').classList.contains('completed'),
                    flagged: li.querySelector(".flagged-todo").classList.contains(activeFlag),
                    date: span ? span.textContent : null
                };
            });
        });
        return todoLists;
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0'); // Pridá 0 na začiatok, ak je deň jednociferný
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mesiace sú indexované od 0
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    function countNumberOfReminders() {
        const todoLists = getActualTodosLists();
        setReminderCounter(todoLists)
    }

    function addSvgClickListener(svg, newTaskItem) {
        svg.addEventListener('click', function () {
            newTaskItem.remove(); // Odstráni celý li pri kliknutí na SVG
            saveTasks(); // Ulož po odstránení
            countNumberOfReminders();
        });
    }

    function addSvgFlagClickListener(svg, newTaskItem) {
        svg.addEventListener('click', function () {
            if (svg.classList.contains(activeFlag)) {
                svg.classList.remove(activeFlag);
            } else {
                addFlag(svg)
            }
            saveTasks(); // Ulož po odstránení
            countNumberOfReminders();
        });
    }

    function addFlag(svg) {
        svg.classList.add(activeFlag);
    }

    function addBlurListener(newTaskItem) {
        taskParagraph.addEventListener('blur', function () {
            if (taskParagraph.textContent.trim() === '') {
                newTaskItem.remove(); // Odstráni celý li, ak je prázdny
            }
            saveTasks();
            countNumberOfReminders();
        });
    }
});
