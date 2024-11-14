document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("aside nav a");
    const titles = document.querySelectorAll(".title h1");
    const addTaskButton = document.getElementById('addTaskButton');
    const searchInput = document.getElementById('search-input');
    const todoFlag = document.querySelector(".flagged-todo");
    const goBackButton = document.getElementById('goBackButton');
    const allNavButton = document.getElementById('allNav');
    const todoList = document.querySelectorAll(".todos");
    let taskParagraph = document.createElement('p');
    const allListsOl = document.querySelector('ol.todos');
    const allTodosContainer = document.querySelector(".todos.all");
    const aside = document.querySelector("aside");
    const main = document.querySelector("main");

    const activeFlag = 'activeFlag';

    let currentTodoList;


    searchInput.addEventListener('focus', () => {
        // ked kliknem na search hodi ma do ALL ktore idem prehladavat
        allNavButton.click();
    });

    // vyhladavanie
    searchInput.addEventListener('input', () => {
        displayAllTasks(allTodosContainer, searchInput.value)
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

            if (targetClass === 'all') {
                // Ak je cieľom zoznam "all", zobraz všetky úlohy zo všetkých zoznamov
                displayAllTasks(allTodosContainer);
                addTaskButton.disabled = true;

            } else {
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
    })

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

        const newTaskItem = document.createElement('li');

        const svg = getSvg();
        const circle = getCircle();
        const flag = getSvgFlagged();

        svg.appendChild(circle);

        taskParagraph = document.createElement('p');
        taskParagraph.contentEditable = true;

        // Pridaj event listener na blur
        addBlurListener(newTaskItem);

        // Pridaj event listener na kliknutie SVG
        addSvgClickListener(svg, newTaskItem);
        addSvgFlagClickListener(flag, newTaskItem);

        newTaskItem.appendChild(svg);
        newTaskItem.appendChild(taskParagraph);
        newTaskItem.appendChild(flag);

        currentTodoList.appendChild(newTaskItem); // Pridaj do aktuálneho zoznamu
        saveTasks(); // Ulož po pridaní úlohy

        taskParagraph.focus();
        countNumberOfReminders();
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
        });
        container.appendChild(taskClone);
    }

    function displayAllTasks(container, search) {
        container.innerHTML = "";

        const todoLists = document.querySelectorAll(".todos:not(.all)");

        todoLists.forEach(todoList => {
            // Získaj triedy (class) z aktuálneho elementu
            const classes = Array.from(todoList.classList); // Prevedieme classList na pole
            // Predpokladajme, že máš len jednu relevantnú triedu
            // Pridaj poslednú triedu do poľa
            const relevantClass = classes.find(className => className !== 'todos');
            const tasks = todoList.querySelectorAll("li");

            tasks.forEach(task => {
                if (search == null) {
                    cloneTask(task, relevantClass, container);
                } else if (task.innerText.includes(search)) {
                    cloneTask(task, relevantClass, container);
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

                if (className === 'all') {
                    numberOfReminders = countItemsExcludingAll(todoLists, 'all')
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

    function countItemsExcludingAll(lists, excludeKey) {
        return Object.keys(lists).reduce((total, key) => {
            // Ak kľúč nie je 'all', sčíta dĺžku poľa
            return key !== excludeKey ? total + lists[key].length : total;
        }, 0);
    }

    function removeTaskFromAllLists(taskId) {
        // Odstráni úlohu zo všetkých zoznamov
        const allTasks = document.querySelectorAll(`[data-id="${taskId}"]`);
        allTasks.forEach(task => task.remove());
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

    function loadTasks() {

        const todoLists = JSON.parse(localStorage.getItem('todoLists'));

        if (todoLists) {
            Object.keys(todoLists).forEach(className => {
                const listElement = document.querySelector(`.todos.${className}`);
                if (listElement) {
                    todoLists[className].forEach(task => {
                        const newTaskItem = document.createElement('li');

                        const svgCircle = getSvg();
                        const circle = getCircle();
                        const flag = getSvgFlagged();

                        svgCircle.appendChild(circle);

                        // Pridaj event listener na blur
                        addBlurListener(newTaskItem);
                        // Pridaj event listener na kliknutie SVG
                        addSvgClickListener(svgCircle, newTaskItem);
                        addSvgFlagClickListener(flag, newTaskItem);

                        if (task.flagged) {
                            addFlag(flag)
                        }

                        taskParagraph = document.createElement('p');
                        taskParagraph.contentEditable = true;
                        taskParagraph.textContent = task.text; // Načítanie textu úlohy

                        newTaskItem.appendChild(svgCircle);
                        newTaskItem.appendChild(taskParagraph);
                        newTaskItem.appendChild(flag);
                        listElement.appendChild(newTaskItem); // Pridaj do aktuálneho zoznamu
                    });
                }
            });
        }
        setReminderCounter(todoLists);
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
                return {
                    text: p.textContent,
                    completed: li.querySelector('svg').classList.contains('completed'),
                    flagged: li.querySelector(".flagged-todo").classList.contains(activeFlag)
                };
            });
        });
        return todoLists;
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
