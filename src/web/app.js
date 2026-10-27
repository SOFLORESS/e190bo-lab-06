
let allIdeas = [];

const list = document.querySelector("#ideas");
const form = document.querySelector("#idea-form");
const searchInput = document.querySelector("#search");
const sortInput = document.querySelector("#sort");
const status = document.querySelector("#status");
const retryButton = document.querySelector("#retry");
const formMessage = document.querySelector("#form-message");

// Load ideas from FastAPI
async function loadIdeas() {
    status.textContent = "Loading ideas...";
    retryButton.hidden = true;

    try {
        const response = await fetch("/ideas");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        allIdeas = await response.json();
        status.textContent = "";
        renderIdeas();

    } catch (error) {
        status.textContent = `Could not load ideas: ${error.message}`;
        retryButton.hidden = false;
        console.error(error);
    }
}

// Filter, sort, and display ideas
function renderIdeas() {
    const search = searchInput.value.trim().toLowerCase();
    const sort = sortInput.value;

    let visibleIdeas = allIdeas.filter((idea) => {
        const title = idea.title.toLowerCase();
        const body = (idea.body || "").toLowerCase();

        return title.includes(search) || body.includes(search);
    });

    if (sort === "votes") {
        visibleIdeas.sort((a, b) => b.vote_count - a.vote_count);
    } else if (sort === "newest") {
        visibleIdeas.sort((a, b) => b.id - a.id);
    } else if (sort === "title") {
        visibleIdeas.sort((a, b) => a.title.localeCompare(b.title));
    }

    list.replaceChildren();

    document.querySelector("#idea-count").textContent =
        `Showing ${visibleIdeas.length} of ${allIdeas.length} ideas`;

    if (allIdeas.length === 0) {
        status.textContent = "No ideas yet. Add the first idea!";
        return;
    }

    if (visibleIdeas.length === 0) {
        status.textContent = "No ideas match your search.";
        return;
    }

    status.textContent = "";

    const maxVotes = Math.max(...allIdeas.map((idea) => idea.vote_count));

    // Tie policy: highlight the lowest-ID idea among leaders.
    // No spotlight when all ideas have zero votes.
    const leader = maxVotes > 0
        ? allIdeas
            .filter((idea) => idea.vote_count === maxVotes)
            .sort((a, b) => a.id - b.id)[0]
        : null;

    for (const idea of visibleIdeas) {
        const li = document.createElement("li");
        li.className = "idea-card";

        if (leader && idea.id === leader.id) {
            li.classList.add("top-idea");

            const label = document.createElement("strong");
            label.textContent = "Top idea";
            label.className = "top-label";
            li.append(label);
        }

        const heading = document.createElement("h3");
        heading.textContent = idea.title;
        li.append(heading);

        if (idea.body) {
            const description = document.createElement("p");
            description.textContent = idea.body;
            li.append(description);
        }

        const votes = document.createElement("p");
        votes.textContent = `${idea.vote_count} votes`;
        li.append(votes);

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Vote";

        button.addEventListener("click", () => {
            vote(idea.id);
        });

        li.append(button);
        list.append(li);
    }
}

// Vote for an idea
async function vote(ideaId) {
    const voter = document.querySelector("#voter").value.trim();

    if (!voter) {
        status.textContent = "Please enter your name before voting.";
        document.querySelector("#voter").focus();
        return;
    }

    status.textContent = "Submitting vote...";

    try {
        const response = await fetch(`/ideas/${ideaId}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ voter: voter })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        status.textContent = "Vote submitted!";
        await loadIdeas();

    } catch (error) {
        status.textContent = `Could not submit vote: ${error.message}`;
        console.error(error);
    }
}

// Add a new idea
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.querySelector("#title").value.trim();
    const body = document.querySelector("#body").value;
    const author = document.querySelector("#author").value;

    formMessage.textContent = "Adding idea...";

    try {
        const response = await fetch("/ideas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                author: author
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        form.reset();
        formMessage.textContent = "Idea added successfully!";
        await loadIdeas();

    } catch (error) {
        formMessage.textContent =
            `Could not add idea: ${error.message}. Please try again.`;
        console.error(error);
    }
});

// Search and sort without additional API requests
searchInput.addEventListener("input", renderIdeas);
sortInput.addEventListener("change", renderIdeas);

// Retry failed loading
retryButton.addEventListener("click", loadIdeas);

// Light and dark theme
const themeButton = document.querySelector("#theme-toggle");

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
}

const savedTheme = localStorage.getItem("theme");

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
    .matches ? "dark" : "light";

setTheme(savedTheme || systemTheme);

themeButton.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
});

// Initial API request
loadIdeas();
