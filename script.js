const promptForm = document.querySelector(".prompt-form");
const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const generateBtn = document.querySelector(".generate-btn");
const galleryGrid = document.querySelector(".gallery-grid");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");

const API_KEY = "Your_API_Key";

const examplePrompts = [
    "A shimmering ice palace surrounded by snow-covered mountains under the northern lights",
    "A bustling futuristic city with towering skyscrapers and robots walking the streets",
    "A hidden jungle temple covered in vines and guarded by ancient stone statues",
    "A giant whale soaring through the sky with islands floating on its back",
    "A neon-lit street in a rainy cyberpunk city with reflections on the wet pavement",
    "A magical mountain retreat with hot springs and glowing lanterns in the night",
    "A pirate ship sailing through a stormy sea with lightning flashing in the sky",
    "A peaceful meadow with wildflowers, a stream, and a distant castle on a hill",
    "A glowing crystal cavern with floating islands and luminescent rocks",
    "A majestic phoenix rising from the ashes in a fiery landscape"
];

(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return { width: calculatedWidth, height: calculatedHeight };
};

const updateImageCard = (index, imageUrl) => {
    const imgCard = document.getElementById(`img-card-${index}`);
    if (!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img class="result-img" src="${imageUrl}" />
                <div class="img-overlay">
                  <a href="${imageUrl}" class="img-download-btn" title="Download Image" download>
                    <i class="fa-solid fa-download"></i>
                  </a>
                </div>`;
};

const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
    const { width, height } = getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled", "true");

    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
        try {
            const response = await fetch(MODEL_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                },
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: { width, height },
                }),
            });

            if (!response.ok) throw new Error((await response.json())?.error);

            const blob = await response.blob();
            updateImageCard(i, URL.createObjectURL(blob));
        } catch (error) {
            console.error(error);
            const imgCard = document.getElementById(`img-card-${i}`);
            imgCard.classList.replace("loading", "error");
            imgCard.querySelector(".status-text").textContent = "Generation failed! Check console for more details.";
        }
    });

    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled");
};

const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    galleryGrid.innerHTML = "";

    for (let i = 0; i < imageCount; i++) {
        galleryGrid.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>`;
    }

    document.querySelectorAll(".img-card").forEach((card, i) => {
        setTimeout(() => card.classList.add("animate-in"), 100 * i);
    });

    generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

const handleFormSubmit = (e) => {
    e.preventDefault();

    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];

    let i = 0;
    promptInput.focus();
    promptInput.value = "";

    promptBtn.disabled = true;
    promptBtn.style.opacity = "0.5";

    const typeInterval = setInterval(() => {
        if (i < prompt.length) {
            promptInput.value += prompt.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
            promptBtn.disabled = false;
            promptBtn.style.opacity = "0.8";
        }
    }, 10);
});

themeToggle.addEventListener("click", toggleTheme);
promptForm.addEventListener("submit", handleFormSubmit);
