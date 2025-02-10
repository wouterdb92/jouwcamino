var imageWidth = 2000;
var imageHeight = 2829;
var isImage2Visible = false;

var map = L.map('map', {
    minZoom: -2,
    maxZoom: 1,
    crs: L.CRS.Simple,
    attributionControl: false,
    zoomSnap: 0.25,
    zoomDelta: 0.25
});

var bounds = [[0, 0], [imageHeight, imageWidth]];
var image1 = L.imageOverlay('Jouw-Camino-background.webp', bounds).addTo(map);
var image2 = L.imageOverlay('overlay-bliksem.webp', bounds).addTo(map);
image2.setOpacity(0);

map.fitBounds(bounds);

var circleCoordinatesMap1 = [
    [1150, 1480], [1809, 1318], [1598, 829], [2522, 1939], [2068, 1434],
    [1489, 1373], [2546, 1462], [858, 600], [920, 1047], [1337, 517],
    [2681, 1771], [1897, 671], [2618, 603], [2133, 340], [2440, 1001],
    [2423, 1326], [1699, 1851], [1534, 1225], [1264, 1024], [1638, 1130]
];

var circleCoordinatesMap2 = [
    [1392, 253], [1071, 628], [930, 1030], [612, 1175], [1153, 1490],
    [106, 1422], [272, 1676], [508, 1875], [1984, 1844], [2398, 1511],
    [2491, 1761], [2256, 890]
];

var circlesMap1 = [];
var circlesMap2 = [];

function addCircles(circleCoordinates, mapLayer, mapId) {
    let circlesArray = mapId === 1 ? circlesMap1 : circlesMap2;

    circleCoordinates.forEach((coords, i) => {
        var circle = L.circle(coords, {
            radius: 50,
            color: 'transparent',
            fillColor: 'transparent',
            fillOpacity: 0,
        }).addTo(mapLayer);

        circle.on('click', async function() {
            if ((mapId === 1 && !isImage2Visible) || (mapId === 2 && isImage2Visible)) {
                const popupContent = await getPopupContent(i + 1, mapId);
                circle.bindPopup(popupContent, {
                    autoPan: true,
                    autoPanPadding: [200, 100],
                    offset: [0, -10]
                }).openPopup();
                map.panTo(circle.getLatLng(), { animate: true, duration: 0.5 });
            }
        });

        circlesArray.push(circle);
    });
}

function removeCircles(mapId) {
    let circlesArray = mapId === 1 ? circlesMap1 : circlesMap2;
    circlesArray.forEach(circle => {
        map.removeLayer(circle);
    });
    circlesArray.length = 0;
}

function toggleMaps() {
    if (!isImage2Visible) {
        image1.setOpacity(0);
        image2.setOpacity(1);
        document.getElementById('lightning-icon').src = 'button-bliksem-off.webp';
        isImage2Visible = true;

        removeCircles(1);
        addCircles(circleCoordinatesMap2, map, 2);
    } else {
        image1.setOpacity(1);
        image2.setOpacity(0);
        document.getElementById('lightning-icon').src = 'button-bliksem.webp';
        isImage2Visible = false;

        removeCircles(2);
        addCircles(circleCoordinatesMap1, map, 1);
    }
}

addCircles(circleCoordinatesMap1, map, 1);

async function openManualPopup(page = 1) {
    const popupContent = await fetchContent(`manual-${page}.html`);

    L.popup()
.setLatLng(function() {
// Get the current map center
var mapCenter = map.getCenter();

// Calculate the vertical offset (40% of the map height)
var offsetY = map.getSize().y * 0.4;  // 40% of the map height

// Shift the center down by the offset (convert pixels to latLng)
var newLatLng = map.unproject([0, offsetY]);  // Get the latLng of the offset
var newCenter = L.latLng(mapCenter.lat + newLatLng.lat, mapCenter.lng);  // Apply the offset to the current center

// Return the new latLng for setting the pop-up position
return newCenter;
}())
.setContent(`
<div class="custom-popup">
    <div id="manual-content">${popupContent}</div>
    <div class="pagination">
        <button onclick="changeManualPage(${page - 1})"> Vorige </button>
        <button onclick="changeManualPage(${page + 1})"> Volgende </button>
    </div>
</div>
`)
.openOn(map);}

async function changeManualPage(page) {
    const newContent = await fetchContent(`manual-${page}.html`);
    if (newContent.includes("Content not available")) {
        return;
    }

    document.getElementById("manual-content").innerHTML = newContent;

    const paginationButtons = document.querySelectorAll(".pagination button");
    paginationButtons[0].setAttribute("onclick", `changeManualPage(${page - 1})`);
    paginationButtons[1].setAttribute("onclick", `changeManualPage(${page + 1})`);
}

async function fetchContent(filename) {
    try {
        const response = await fetch(filename);
        return response.ok ? await response.text() : "<p>Content not available</p>";
    } catch {
        return "<p>Content not available</p>";
    }
}

async function getPopupContent(circleNumber, mapId) {
    let tab1Page = 1;
    let tab2Page = 1;

    async function fetchTabContent(tabNumber, pageNumber) {
        const filename = `${mapId}-${circleNumber}-${tabNumber}-${pageNumber}.html`;
        return await fetchContent(filename);
    }

    const tab1Content = await fetchTabContent(1, tab1Page);
    const tab2Content = await fetchTabContent(2, tab2Page);

    return `
        <div class="custom-popup">
            <div class="tab-container">
                <button class="tab transparent-button active" onclick="switchTab(event, 'tab1', ${circleNumber})">
                    <img src="hart.webp" alt="Hart" width="30" height="30">
                </button>
                <button class="tab transparent-button" onclick="switchTab(event, 'tab2', ${circleNumber})">
                    <img src="dobbelsteen.webp" alt="Speluitleg" width="30" height="30">
                </button>
            </div>
            <div id="tab1" class="tab-content active">
                <div id="tab1-content" data-page="${tab1Page}">${tab1Content}</div>
                <div class="pagination">
                    <button onclick="changePage(${circleNumber}, ${mapId}, 1, -1)"> Vorige </button>
                    <button onclick="changePage(${circleNumber}, ${mapId}, 1, 1)"> Volgende </button>
                </div>
            </div>
            <div id="tab2" class="tab-content">
                <div id="tab2-content" data-page="${tab2Page}">${tab2Content}</div>
                <div class="pagination">
                    <button onclick="changePage(${circleNumber}, ${mapId}, 2, -1)"> Vorige </button>
                    <button onclick="changePage(${circleNumber}, ${mapId}, 2, 1)"> Volgende </button>
                </div>
            </div>
        </div>
    `;
}

function switchTab(event, tabId, circleNumber) {
    const tabs = event.target.closest('.tab-container').querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    const tabContents = document.querySelectorAll(`#tab1, #tab2`);
    tabContents.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
}

async function changePage(circleNumber, mapId, tabNumber, increment) {
    const tabContent = document.getElementById(`tab${tabNumber}-content`);
    const currentPage = parseInt(tabContent.getAttribute("data-page"));
    const newPage = currentPage + increment;

    const newContent = await fetchContent(`${mapId}-${circleNumber}-${tabNumber}-${newPage}.html`);
    if (newContent.includes("Content not available")) {
        return;
    }

    tabContent.setAttribute("data-page", newPage);
    tabContent.innerHTML = newContent;
}

window.addEventListener("load", function () {
    console.log("Volledige pagina is geladen!");
    openManualPopup(); // open documentatie popup
});

