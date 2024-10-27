document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("aside nav a");
    const titles = document.querySelectorAll(".title h1");
    const addTaskButton = document.getElementById('addTaskButton');
    const todoList = document.querySelectorAll(".todos");
    let taskParagraph = document.createElement('p');
    let currentTodoList;

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const targetClass = link.className;
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
        });
    });

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

    // Uloženie úloh
    function saveTasks() {
        const todoLists = {};

        document.querySelectorAll('.todos').forEach((list) => {
            const listClass = list.className.split(' ').find(c => c !== 'todos');
            todoLists[listClass] = Array.from(list.getElementsByTagName('li')).map(li => {
                const p = li.querySelector('p');
                return {
                    text: p.textContent,
                    completed: li.querySelector('svg').classList.contains('completed')
                };
            });
        });

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

                        const svg = getSvg();
                        const circle = getCircle()

                        svg.appendChild(circle);

                        // Pridaj event listener na blur
                        taskParagraph.addEventListener('blur', function () {
                            if (taskParagraph.textContent.trim() === '') {
                                newTaskItem.remove(); // Odstráni celý li, ak je prázdny
                            }
                            saveTasks()
                        });

                        // Pridaj event listener na kliknutie SVG
                        svg.addEventListener('click', function () {
                            newTaskItem.remove(); // Odstráni celý li pri kliknutí na SVG
                            saveTasks(); // Ulož po odstránení
                        });

                        taskParagraph = document.createElement('p');
                        taskParagraph.contentEditable = true;
                        taskParagraph.textContent = task.text; // Načítanie textu úlohy

                        newTaskItem.appendChild(svg);
                        newTaskItem.appendChild(taskParagraph);
                        listElement.appendChild(newTaskItem); // Pridaj do aktuálneho zoznamu
                    });
                }
            });
        }
    }

    // Pridaj úlohu do aktuálneho viditeľného zoznamu
    addTaskButton.addEventListener('click', function () {
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
        const circle = getCircle()

        svg.appendChild(circle);

        taskParagraph = document.createElement('p');
        taskParagraph.contentEditable = true;

        // Pridaj event listener na blur
        taskParagraph.addEventListener('blur', function () {
            if (taskParagraph.textContent.trim() === '') {
                newTaskItem.remove(); // Odstráni celý li, ak je prázdny
            }
            saveTasks();
        });

        // Pridaj event listener na kliknutie SVG
        svg.addEventListener('click', function () {
            newTaskItem.remove(); // Odstráni celý li pri kliknutí na SVG
            saveTasks(); // Ulož po odstránení
        });

        newTaskItem.appendChild(svg);
        newTaskItem.appendChild(taskParagraph);

        currentTodoList.appendChild(newTaskItem); // Pridaj do aktuálneho zoznamu
        saveTasks(); // Ulož po pridaní úlohy

        taskParagraph.focus();
    });

    loadTasks(); // Načítaj úlohy po načítaní stránky
});
