window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Switch 3D Model
function switchModel(modelName) {
    const modelViewer = document.getElementById('model-viewer');
    const buttons = document.querySelectorAll('.model-switch-btn');
    
    if (modelViewer) {
        // Update model source
        modelViewer.src = `static/3d/${modelName}.glb`;
        
        // Update button active state
        buttons.forEach(btn => {
            if (btn.getAttribute('data-model') === modelName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

// ---------- Fusion Pair Gallery ----------
const fusionPairFolders = [
    '00016N',
    '00024N',
    '00036N',
    '00055D',
    '00123D',
    '00196D'
];

const fusionPairs = fusionPairFolders.map(folder => ({
    folder,
    rgb: `static/images/fusion_pair/${folder}/rgb.png`,
    sage: `static/images/fusion_pair/${folder}/sage.png`,
    ours: `static/images/fusion_pair/${folder}/ours.png`
}));

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function createFusionColumn(pair) {
    const column = document.createElement('div');
    column.className = 'column is-6-desktop is-12-tablet';
    column.innerHTML = `
        <div class="fusion-card" data-folder="${pair.folder}">
            <div class="fusion-card-header">
                <span class="fusion-card-title">${pair.folder}</span>
            </div>
            <div class="fusion-slider" data-folder="${pair.folder}" data-split-left="33" data-split-right="66" style="--split-left: 33%; --split-right: 66%;">
                <img src="${pair.rgb}" alt="${pair.folder} RGB" class="fusion-layer fusion-layer--rgb" draggable="false">
                <img src="${pair.sage}" alt="${pair.folder} Sage" class="fusion-layer fusion-layer--sage" draggable="false">
                <img src="${pair.ours}" alt="${pair.folder} Ours" class="fusion-layer fusion-layer--ours" draggable="false">
                <div class="fusion-handle fusion-handle--left" data-handle="left" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="33" aria-label="Adjust RGB/Sage divider" tabindex="0"></div>
                <div class="fusion-handle fusion-handle--right" data-handle="right" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="66" aria-label="Adjust Sage/Ours divider" tabindex="0"></div>
                <span class="fusion-segment-label fusion-segment-label--left">RGB</span>
                <span class="fusion-segment-label fusion-segment-label--center">Sage</span>
                <span class="fusion-segment-label fusion-segment-label--right">Ours</span>
            </div>
        </div>`;

    return column;
}

function initTripleSlider(slider) {
    if (!slider) return;

    const leftHandle = slider.querySelector('[data-handle="left"]');
    const rightHandle = slider.querySelector('[data-handle="right"]');

    if (!leftHandle || !rightHandle) return;

    const minGap = 0; // allow overlap but prevent crossing
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const state = {
        left: Number(slider.dataset.splitLeft) || 33,
        right: Number(slider.dataset.splitRight) || 66
    };

    const applyState = () => {
        slider.style.setProperty('--split-left', `${state.left}%`);
        slider.style.setProperty('--split-right', `${state.right}%`);
        leftHandle.setAttribute('aria-valuenow', Math.round(state.left));
        rightHandle.setAttribute('aria-valuenow', Math.round(state.right));
    };

    const getPercent = clientX => {
        const rect = slider.getBoundingClientRect();
        if (rect.width === 0) return 0;
        const percent = ((clientX - rect.left) / rect.width) * 100;
        return clamp(percent, 0, 100);
    };

    let activeHandle = null;

    const updateFromPointer = clientX => {
        if (!activeHandle) return;
        const percent = getPercent(clientX);
        if (activeHandle === 'left') {
            state.left = Math.min(percent, state.right - minGap);
        } else {
            state.right = Math.max(percent, state.left + minGap);
        }
        applyState();
    };

    const endPointer = event => {
        if (!activeHandle) return;
        slider.releasePointerCapture?.(event.pointerId);
        activeHandle = null;
    };

    const startDrag = (handle, event) => {
        activeHandle = handle;
        slider.setPointerCapture?.(event.pointerId);
        updateFromPointer(event.clientX);
        event.preventDefault();
    };

    const pickHandle = clientX => {
        const percent = getPercent(clientX);
        const distLeft = Math.abs(percent - state.left);
        const distRight = Math.abs(percent - state.right);
        return distLeft <= distRight ? 'left' : 'right';
    };

    slider.addEventListener('pointerdown', event => {
        const targetHandle = event.target.dataset?.handle;
        const handleToUse = targetHandle || pickHandle(event.clientX);
        startDrag(handleToUse, event);
    });

    slider.addEventListener('pointermove', event => {
        if (!activeHandle) return;
        updateFromPointer(event.clientX);
        event.preventDefault();
    });

    slider.addEventListener('pointerup', endPointer);
    slider.addEventListener('pointercancel', endPointer);

    [leftHandle, rightHandle].forEach(handle => {
        handle.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
            event.preventDefault();
            const delta = (event.key === 'ArrowLeft' || event.key === 'ArrowDown') ? -3 : 3;
            if (handle.dataset.handle === 'left') {
                state.left = clamp(state.left + delta, 0, state.right - minGap);
            } else {
                state.right = clamp(state.right + delta, state.left + minGap, 100);
            }
            applyState();
        });
    });

    applyState();
}

function setupFusionCard(column) {
    const slider = column.querySelector('.fusion-slider');
    initTripleSlider(slider);
}

function initFusionGallery() {
    const track = document.getElementById('fusionCarouselTrack');
    const dotsContainer = document.getElementById('fusionCarouselDots');
    const prevBtn = document.getElementById('fusionPrev');
    const nextBtn = document.getElementById('fusionNext');
    const carousel = document.querySelector('.fusion-carousel');

    if (!track || fusionPairs.length === 0) {
        return;
    }

    const groups = chunkArray(fusionPairs, 2);
    track.innerHTML = '';
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
    }

    groups.forEach(group => {
        const slide = document.createElement('div');
        slide.className = 'fusion-carousel-slide';
        const columns = document.createElement('div');
        columns.className = 'columns is-variable is-4 is-multiline';

        group.forEach(pair => {
            const column = createFusionColumn(pair);
            columns.appendChild(column);
            setupFusionCard(column);
        });

        if (group.length === 1) {
            const filler = document.createElement('div');
            filler.className = 'column is-hidden-touch';
            columns.appendChild(filler);
        }

        slide.appendChild(columns);
        track.appendChild(slide);
    });

    let activeSlide = 0;
    const totalSlides = groups.length;
    const dots = [];

    const goToSlide = index => {
        activeSlide = (index + totalSlides) % totalSlides;
        track.style.transform = `translateX(-${activeSlide * 100}%)`;
        dots.forEach((dot, idx) => {
            if (idx === activeSlide) {
                dot.classList.add('is-active');
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.classList.remove('is-active');
                dot.removeAttribute('aria-current');
            }
        });
    };

    if (dotsContainer) {
        groups.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = `fusion-dot-btn${index === 0 ? ' is-active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            if (index === 0) {
                dot.setAttribute('aria-current', 'true');
            }
            dot.addEventListener('click', () => {
                goToSlide(index);
            });
            dots.push(dot);
            dotsContainer.appendChild(dot);
        });
    }

    prevBtn?.addEventListener('click', () => {
        goToSlide(activeSlide - 1);
    });

    nextBtn?.addEventListener('click', () => {
        goToSlide(activeSlide + 1);
    });
}

$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var options = {
		slidesToScroll: 1,
		slidesToShow: 1,
		loop: true,
		infinite: true,
		autoplay: true,
		autoplaySpeed: 5000,
    }

	// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
	
    bulmaSlider.attach();
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

    // Build interactive fusion gallery
    initFusionGallery();

})
