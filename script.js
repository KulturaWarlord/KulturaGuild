/* ============================================================
   KULTURA GUILD & ALLIANCE — MAIN SYSTEM SCRIPT (script.js)
   ============================================================ */

// ⚖️ AUCTION DISCORD WEBHOOK URL
const AUCTION_DISCORD_WEBHOOK_URL = "https://kultura-webhook-proxy.official-drickz.workers.dev";
let cloudAuctionItems = [];

// 🎙️ HIGH-ENERGY SPORTS / ESPORTS ANNOUNCER TTS ENGINE
function speakKantyawanText(textToSpeak) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let cleanText = textToSpeak.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        let utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.15;
        utterance.pitch = 1.25;
        utterance.volume = 1.0;
        let voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.lang.includes('tl') || v.lang.includes('fil') || v.lang.includes('id') || v.lang.includes('en-PH'));
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB') || v.lang.includes('en'));
        }
        if (selectedVoice) { utterance.voice = selectedVoice; }
        window.speechSynthesis.speak(utterance);
    }
}

function enableFirstClickAudio() {
    const playSound = () => {
        const audio = document.getElementById('bg-audio');
        if (audio && audio.paused) {
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Autoplay blocked until user interaction", e));
        }
        window.removeEventListener('click', playSound);
        window.removeEventListener('keydown', playSound);
        window.removeEventListener('touchstart', playSound);
    };
    window.addEventListener('click', playSound);
    window.addEventListener('keydown', playSound);
    window.addEventListener('touchstart', playSound);
}
enableFirstClickAudio();

document.addEventListener('DOMContentLoaded', () => {
    const footerContainer = document.getElementById('dynamic-secure-credits');
    if (footerContainer) {
        const p1 = document.createElement('p');
        p1.innerHTML = '&copy; 2026 <span>Kultura Guild</span> — NoLimit MU Online Community. All Rights Reserved.';
        const p2 = document.createElement('p');
        p2.style.cssText = "margin-top: 6px; font-size: 0.75rem; color: #7a7a90; letter-spacing: 1px;";
        p2.innerHTML = 'Developed & Maintained by <span style="color: var(--primary);">Lord Emperor Warlock</span>';
        footerContainer.appendChild(p1);
        footerContainer.appendChild(p2);
    }

    const leftLetters = document.querySelectorAll('#left-floating-word span');
    leftLetters.forEach((letter, index) => { letter.style.animationDelay = `${index * 0.12}s`; });

    const rightLetters = document.querySelectorAll('#right-floating-word span');
    rightLetters.forEach((letter, index) => { letter.style.animationDelay = `${index * 0.12}s`; });
});

function initPageCounter() {
    if (!window.database) return;
    const dbRef = window.dbRef;
    const dbGet = window.dbGet;
    const dbSet = window.dbSet;
    const database = window.database;

    const viewCountRef = dbRef(database, 'kultura_page_views');

    dbGet(viewCountRef).then((snapshot) => {
        let currentViews = snapshot.exists() ? snapshot.val() : 1000; 
        let newViews = currentViews + 1;
        dbSet(viewCountRef, newViews);

        const counterElem = document.getElementById('live-page-views-count');
        if (counterElem) {
            counterElem.innerText = newViews.toLocaleString();
        }
    }).catch((error) => {
        console.error("Error updating page views:", error);
    });
}

// 🌐 DISCORD WEBHOOK FOR ATTENDANCE & PAYOUTS
const ATTENDANCE_DISCORD_WEBHOOK_URL = "https://kultura-webhook-proxy.official-drickz.workers.dev";

let ALL_DIVISIONS = [
    "Fullclip Division (Fullclip)",
    "Warlock Division (Warlock)",
    "PROTECT Division (Windtalker)",
    "STEALTH Division (LordDwight)",
    "ANXIETY Division (iKapitana)"
];

let PROTECTED_ADMIN_ACCOUNTS = [
    "fullclip", "warlock", "lorddwight", "windtalker", "ikapitana", "mechado", "tsukushi", "kultura", "kulturamain"
];

const GUILD_MASTERS_LIST = ["fullclip", "warlock", "lorddwight", "windtalker", "ikapitana"];
let OFFICER_ACCOUNTS_SYNC = {};

const defaultDivisionMembers = {
    "Fullclip Division (Fullclip)": [
        { name: "Fullclip", class: "Blade Master", icon: "👑", mainOwner: "Fullclip" },
        { name: "Mechado", class: "Blade Master", icon: "⚔️", mainOwner: "Mechado" }
    ],
    "Warlock Division (Warlock)": [
        { name: "Warlock", class: "Blade Master", icon: "👑", mainOwner: "Warlock" },
        { name: "Tsukushi", class: "Blade Master", icon: "🛡️", mainOwner: "Tsukushi" }
    ],
    "PROTECT Division (Windtalker)": [
        { name: "Windtalker", class: "Blade Master", icon: "👑", mainOwner: "Windtalker" }
    ],
    "STEALTH Division (LordDwight)": [
        { name: "LordDwight", class: "Dark Lord", icon: "👑", mainOwner: "LordDwight" }
    ],
    "ANXIETY Division (iKapitana)": [
        { name: "iKapitana", class: "Summoner", icon: "👑", mainOwner: "iKapitana" }
    ]
};

const defaultGuildEvents = {
    events: [
        {
            title: "CASTLE SIEGE WAR",
            time: "📅 Saturday | 6:00 PM PH Time",
            desc: "Mandatory attendance for all main members and alliance rosters. Be ready 30 mins prior."
        },
        {
            title: "GUILD EVENTS",
            time: "📅 Saturday | 8:00 PM PH Time",
            desc: "All Guild Leaders will host an Event."
        }
    ],
    giveawayVisible: "HIDE"
};

let cloudGuildData = null;
let cloudAttendanceHistory = null;
let cloudResetTickets = [];
let cloudGuildEvents = null;
let currentLoggedInOfficer = null;
let cached3DayPayoutData = null;

let inactivityTimer = null;
const INACTIVITY_LIMIT = 5 * 60 * 1000;

function resetInactivityTimer() {
    if (!currentLoggedInOfficer) return;
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert("⏳ The 5-minute inactivity limit has been reached. You have been automatically logged out.");
        handleLogout();
    }, INACTIVITY_LIMIT);
}

['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(eventType => {
    window.addEventListener(eventType, resetInactivityTimer);
});

function updatePortalButtonUI() {
    const btn = document.getElementById('open-officer-portal-btn');
    if (!btn) return;

    if (currentLoggedInOfficer) {
        btn.classList.add('portal-btn-top-left');
        btn.innerHTML = `🔓 Open Officer Portal (@${currentLoggedInOfficer})`;
    } else {
        btn.classList.remove('portal-btn-top-left');
        btn.innerHTML = `🔐 Open Authorized Officer Portal`;
    }
}

function getStandardDateKey() {
    const dateInput = document.getElementById('admin-attendance-date');
    if (dateInput && dateInput.value) {
        return dateInput.value;
    }
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function searchMainAndDummies() {
    const rawQuery = document.getElementById('search-main-input') ? document.getElementById('search-main-input').value.trim() : '';
    const query = rawQuery.toLowerCase();
    const resultBox = document.getElementById('search-dummy-result-box');
    if (!resultBox) return;

    if (!query) {
        resultBox.innerHTML = `<span style="color: var(--text-dim); font-style: italic;">Type a Main or Dummy character name to search...</span>`;
        return;
    }

    let data = getGuildData();
    let mainGroups = {};
    let allMembersFlat = [];

    for (let divKey in data) {
        let members = data[divKey];
        members.forEach(m => {
            let rawMainName = m.mainOwner ? m.mainOwner : m.name;
            let mainKey = rawMainName.toLowerCase();

            allMembersFlat.push({
                name: m.name,
                class: m.class,
                division: divKey,
                mainOwner: rawMainName,
                isDummy: m.name.toLowerCase() !== mainKey
            });

            if (!mainGroups[mainKey]) {
                mainGroups[mainKey] = { mainIgn: rawMainName, mainDivision: divKey, dummies: [] };
            }
            if (m.name.toLowerCase() !== mainKey) {
                mainGroups[mainKey].dummies.push({ name: m.name, division: divKey, class: m.class });
            }
        });
    }

    let displayHtml = '';
    let foundMatch = false;

    let matchedMainKeys = Object.keys(mainGroups).filter(k => k.includes(query));
    if (matchedMainKeys.length > 0) {
        foundMatch = true;
        matchedMainKeys.forEach(mainKey => {
            let info = mainGroups[mainKey];
            let dummyCount = info.dummies.length;

            let dummyListHtml = '';
            if (dummyCount > 0) {
                info.dummies.forEach(d => {
                    dummyListHtml += `
                        <li style="margin-left: 15px; color: #fff; display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span>🎭 <strong>${d.name}</strong> <small style="color: var(--text-dim);">(${d.class} - ${d.division})</small></span>
                            <button onclick="unlinkDummyAccount('${d.name}')" class="delete-btn" style="padding: 2px 6px; font-size: 0.7rem;">🔓 Unlink</button>
                        </li>`;
                });
            } else {
                dummyListHtml = `<span style="color: var(--text-dim); margin-left: 15px; font-size: 0.8rem;">(No linked dummy accounts)</span>`;
            }

            displayHtml += `
                <div style="background: rgba(230,184,0,0.1); border-left: 3px solid var(--primary); padding: 8px 10px; margin-bottom: 8px; border-radius: 4px;">
                    <div style="color: var(--primary-glow); font-weight: bold; font-size: 0.95rem;">
                        👑 Main Character: <span style="color: #fff;">${info.mainIgn}</span> 
                        <small style="color: #33cc33; font-weight: normal;">[${info.mainDivision}]</small>
                    </div>
                    <div style="margin-top: 4px; font-size: 0.85rem;">
                        <strong style="color: #ffaa33;">Linked Dummies (${dummyCount}):</strong>
                        <ul style="list-style-type: none; padding: 0; margin-top: 2px;">
                            ${dummyListHtml}
                        </ul>
                    </div>
                </div>
            `;
        });
    }

    let matchedDummies = allMembersFlat.filter(m => m.isDummy && m.name.toLowerCase().includes(query));
    if (matchedDummies.length > 0) {
        foundMatch = true;
        matchedDummies.forEach(d => {
            let mainDiv = findMainGuildDivision(d.mainOwner) || "Unknown Division";
            displayHtml += `
                <div style="background: rgba(255,170,51,0.1); border-left: 3px solid #ffaa33; padding: 8px 10px; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #ffaa33; font-weight: bold; font-size: 0.95rem;">
                            🎭 Searched Dummy: <span style="color: #fff;">${d.name}</span> <small style="color: var(--text-dim);">(${d.class} - ${d.division})</small>
                        </div>
                        <div style="margin-top: 4px; font-size: 0.85rem; color: #33cc33;">
                            🔗 Belongs to Main Character: <strong>👑 ${d.mainOwner}</strong> <small style="color: var(--text-dim);">[${mainDiv}]</small>
                        </div>
                    </div>
                    <button onclick="unlinkDummyAccount('${d.name}')" class="delete-btn" style="padding: 4px 8px; font-size: 0.75rem;">🔓 Unlink</button>
                </div>
            `;
        });
    }

    if (!foundMatch) {
        resultBox.innerHTML = `<span style="color: #ff3333;">⚠️ No Main or Dummy Character found matching "<strong>${rawQuery}</strong>".</span>`;
        return;
    }

    resultBox.innerHTML = displayHtml;
}

async function unlinkDummyAccount(dummyIgn) {
    const confirmUnlink = confirm(`⚠️ Are you sure you want to unlink "${dummyIgn}"? It will revert back to being independent or its own main.`);
    if (!confirmUnlink) return;

    let data = getGuildData();
    let found = false;

    for (let divKey in data) {
        let member = data[divKey].find(m => m.name.toLowerCase() === dummyIgn.toLowerCase());
        if (member) {
            member.mainOwner = member.name;
            member.icon = getClassIcon(member.class);
            found = true;
            break;
        }
    }

    if (found) {
        await saveGuildData(data);
        alert(`🔓 Successfully unlinked "${dummyIgn}"!`);
        searchMainAndDummies();
        renderRosters();
    } else {
        alert(`⚠️ Error: Dummy character not found in database.`);
    }
}

function initRealtimeListeners() {
    if (!window.database) return;
    const dbRef = window.dbRef;
    const dbOnValue = window.dbOnValue;

    dbOnValue(dbRef(window.database, 'kultura_officer_accounts'), (snap) => {
        if (snap.exists()) { OFFICER_ACCOUNTS_SYNC = snap.val(); }
    });

    dbOnValue(dbRef(window.database, 'kultura_roster'), (snap) => {
        if (snap.exists()) {
            cloudGuildData = snap.val();
        } else {
            cloudGuildData = defaultDivisionMembers;
            window.dbSet(dbRef(window.database, 'kultura_roster'), defaultDivisionMembers);
        }
        renderRosters();
        updateLiveActiveWarriors();
        searchMainAndDummies();
        if (document.getElementById('attendance-admin-modal').style.display === 'flex') {
            onDivisionChange();
        }
    });

    dbOnValue(dbRef(window.database, 'kultura_attendance'), (snap) => {
        if (snap.exists()) {
            cloudAttendanceHistory = snap.val();
        } else {
            cloudAttendanceHistory = [];
        }
        renderAttendanceHistory();
        renderAdminAttendanceLogList();
        updateLiveActiveWarriors();
        updatePublicGiveawayDisplay();
    });

    dbOnValue(dbRef(window.database, 'kultura_reset_tickets'), (snap) => {
        if (snap.exists()) {
            cloudResetTickets = snap.val();
        } else {
            cloudResetTickets = [];
        }
        renderSuperAdminInbox();
    });

    dbOnValue(dbRef(window.database, 'kultura_events'), (snap) => {
        if (snap.exists()) {
            cloudGuildEvents = snap.val();
        } else {
            cloudGuildEvents = defaultGuildEvents;
        }
        renderPublicGuildEvents();
        populateEventsAdminForm();
        updateGiveawayBotVisibility();
    });

    // Realtime Auction Items Listener
    dbOnValue(dbRef(window.database, 'kultura_auction_items'), (snap) => {
        cloudAuctionItems = snap.exists() ? snap.val() : [];
        renderAdminAuctionList();
    });
}

window.addEventListener('firebase-ready', () => {
    initRealtimeListeners();
    initPageCounter();
    checkMarketplaceAuthOnLoad();
});

function getGuildData() {
    return cloudGuildData ? cloudGuildData : defaultDivisionMembers;
}

async function saveGuildData(data) {
    cloudGuildData = data;
    if (window.database) {
        await window.dbSet(window.dbRef(window.database, 'kultura_roster'), data);
    }
    renderRosters();
    updateLiveActiveWarriors();
    searchMainAndDummies();
}

function renderPublicGuildEvents() {
    const container = document.getElementById('dynamic-events-container');
    if (!container) return;

    const eventsData = cloudGuildEvents || defaultGuildEvents;
    const events = Array.isArray(eventsData) ? eventsData : (eventsData.events || defaultGuildEvents.events);
    container.innerHTML = '';

    events.forEach(ev => {
        const box = document.createElement('div');
        box.className = 'schedule-box';
        box.innerHTML = `
            <div class="schedule-title">${ev.title || 'GUILD EVENT'}</div>
            <div class="schedule-time">${ev.time || 'Schedule TBA'}</div>
            <p style="font-size: 0.9rem; color: var(--text-light);">${ev.desc || ''}</p>
        `;
        container.appendChild(box);
    });
}

function populateEventsAdminForm() {
    const eventsData = cloudGuildEvents || defaultGuildEvents;
    const events = Array.isArray(eventsData) ? eventsData : (eventsData.events || defaultGuildEvents.events);
    const isVisible = Array.isArray(eventsData) ? "HIDE" : (eventsData.giveawayVisible || "HIDE");

    if (events[0]) {
        if (document.getElementById('event1-title')) document.getElementById('event1-title').value = events[0].title || '';
        if (document.getElementById('event1-time')) document.getElementById('event1-time').value = events[0].time || '';
        if (document.getElementById('event1-desc')) document.getElementById('event1-desc').value = events[0].desc || '';
    }
    if (events[1]) {
        if (document.getElementById('event2-title')) document.getElementById('event2-title').value = events[1].title || '';
        if (document.getElementById('event2-time')) document.getElementById('event2-time').value = events[1].time || '';
        if (document.getElementById('event2-desc')) document.getElementById('event2-desc').value = events[1].desc || '';
    }
    if (document.getElementById('giveawaybot-visibility-select')) {
        document.getElementById('giveawaybot-visibility-select').value = isVisible;
    }
}

function updateGiveawayBotVisibility() {
    const superGiveawayBlock = document.getElementById('superadmin-giveaway-block');
    const publicGiveawaySection = document.getElementById('public-giveaway-display-section');
    
    let currentLower = currentLoggedInOfficer ? currentLoggedInOfficer.toLowerCase() : '';
    let isSuperAdmin = (currentLower === "fullclip" || currentLower === "kultura" || currentLower === "kulturamain");

    const eventsData = cloudGuildEvents || defaultGuildEvents;
    const isVisible = Array.isArray(eventsData) ? "HIDE" : (eventsData.giveawayVisible || "HIDE");

    if (superGiveawayBlock) {
        if (isSuperAdmin && isVisible === "SHOW") {
            superGiveawayBlock.style.display = 'block';
        } else {
            superGiveawayBlock.style.display = 'none';
        }
    }

    if (publicGiveawaySection) {
        if (isVisible === "SHOW") {
            publicGiveawaySection.style.display = 'block';
            updatePublicGiveawayDisplay();
        } else {
            publicGiveawaySection.style.display = 'none';
        }
    }
}

function updatePublicGiveawayDisplay() {
    const qualifiedListElem = document.getElementById('public-qualified-list');
    const publicWinnersBox = document.getElementById('public-winners-display-box');
    if (!qualifiedListElem) return;

    const history = cloudAttendanceHistory || [];
    const csRecords = history.filter(r => r.event === "Castle Siege War").slice(0, 3);
    
    if (csRecords.length < 3) {
        qualifiedListElem.innerHTML = `<span style="color: var(--text-dim);">Requires 3 recorded Castle Siege events (Current: ${csRecords.length}/3).</span>`;
    } else {
        let csMainCounts = {};
        csRecords.forEach(rec => {
            if (rec.presents) {
                let uniqueMainsInEvent = new Set();
                rec.presents.forEach(p => {
                    let mainKey = (p.name || "").toLowerCase().trim();
                    if (mainKey) uniqueMainsInEvent.add(mainKey);
                });
                uniqueMainsInEvent.forEach(mKey => {
                    csMainCounts[mKey] = (csMainCounts[mKey] || 0) + 1;
                });
            }
        });

        let qualifiedMains = Object.keys(csMainCounts).filter(mKey => {
            let isGm = GUILD_MASTERS_LIST.some(gm => gm.toLowerCase() === mKey);
            return csMainCounts[mKey] === 3 && !isGm;
        });

        if (qualifiedMains.length === 0) {
            qualifiedListElem.innerHTML = `<span style="color: var(--text-dim);">No eligible members (non-GMs) have completed 3/3 CS attendance yet.</span>`;
        } else {
            let html = `<ul style="padding-left: 15px; margin: 0;">`;
            qualifiedMains.forEach(mKey => {
                let originalNameDisplay = getOriginalCasedMainName(mKey) || mKey;
                html += `<li>👑 <strong>${originalNameDisplay}</strong> <span style="color: #33cc33;">(3/3 Verified)</span></li>`;
            });
            html += `</ul>`;
            qualifiedListElem.innerHTML = html;
        }
    }

    let latestCS = history.find(r => r.event === "Castle Siege War");
    if (latestCS && latestCS.giveawayWinners && latestCS.giveawayWinners.length > 0) {
        let winnersHtml = '';
        latestCS.giveawayWinners.forEach((wKey, i) => {
            let originalNameDisplay = getOriginalCasedMainName(wKey) || wKey;
            let mainDiv = findMainGuildDivision(originalNameDisplay) || "Kultura Alliance";
            winnersHtml += `🏎️ <strong>Round ${i+1} Winner: ${originalNameDisplay}</strong> <span style="color: #33cc33;">(${mainDiv})</span><br>`;
        });
        if (publicWinnersBox) publicWinnersBox.innerHTML = winnersHtml;
    } else {
        if (publicWinnersBox) publicWinnersBox.innerHTML = `<em style="color: var(--text-dim);">No car race winners yet.</em>`;
    }
}

function getOriginalCasedMainName(lowerKey) {
    let data = getGuildData();
    for (let divKey in data) {
        let found = data[divKey].find(m => (m.mainOwner || m.name).toLowerCase() === lowerKey);
        if (found) return found.mainOwner || found.name;
    }
    return lowerKey;
}

async function saveGuildEventsToFirebase() {
    if (!currentLoggedInOfficer) return;

    const isGiveawayVisible = document.getElementById('giveawaybot-visibility-select').value;
    const ev1Title = document.getElementById('event1-title').value.trim();
    const ev1Time = document.getElementById('event1-time').value.trim();
    const ev1Desc = document.getElementById('event1-desc').value.trim();
    const ev2Title = document.getElementById('event2-title').value.trim();
    const ev2Time = document.getElementById('event2-time').value.trim();
    const ev2Desc = document.getElementById('event2-desc').value.trim();

    const newEventsPayload = {
        events: [
            { title: ev1Title, time: ev1Time, desc: ev1Desc },
            { title: ev2Title, time: ev2Time, desc: ev2Desc }
        ],
        giveawayVisible: isGiveawayVisible
    };

    if (window.database) {
        await window.dbSet(window.dbRef(window.database, 'kultura_events'), newEventsPayload);
    }

    if (ATTENDANCE_DISCORD_WEBHOOK_URL) {
        try {
            const discordBody = {
                username: "Kultura Guild Event Announcer",
                avatar_url: "https://nolimit.lv/themes/def_theme/images/logo.png",
                content: "@everyone 📢 **GUILD EVENTS SCHEDULE IS LIVE!**",
                embeds: [{
                    title: "⚔️ KULTURA ALLIANCE - UPCOMING EVENTS ⚔️",
                    color: 15120128,
                    fields: [
                        { name: `📌 ${ev1Title || 'Event 1'}`, value: `**Schedule:** ${ev1Time || 'N/A'}\n**Details:** ${ev1Desc || 'N/A'}`, inline: false },
                        { name: `📌 ${ev2Title || 'Event 2'}`, value: `**Schedule:** ${ev2Time || 'N/A'}\n**Details:** ${ev2Desc || 'N/A'}`, inline: false }
                    ],
                    footer: { text: "Kultura Guild & Alliance • NoLimit MU Online", icon_url: "https://nolimit.lv/themes/def_theme/images/logo.png" },
                    timestamp: new Date().toISOString()
                }]
            };
            await fetch(ATTENDANCE_DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(discordBody) });
        } catch (err) { console.error("Discord Webhook Error:", err); }
    }
    alert("🎉 Success! Guild Events updated on Website and successfully announced to your Discord channel!");
}

async function sendCustomDiscordAnnouncement() {
    if (!currentLoggedInOfficer) return;

    const selectedSender = document.getElementById('discord-announce-sender').value;
    const title = document.getElementById('discord-announce-title').value.trim();
    const message = document.getElementById('discord-announce-msg').value.trim();

    if (!message) { alert("⚠️ Please enter an announcement message!"); return; }

    try {
        const discordBody = {
            username: "Kultura Guild Announcer",
            avatar_url: "https://nolimit.lv/themes/def_theme/images/logo.png",
            content: "@everyone 📢 **OFFICIAL GUILD ANNOUNCEMENT**",
            embeds: [{
                title: title || "📢 GUILD ANNOUNCEMENT",
                description: message,
                color: 15120128,
                footer: { text: `Announced by ${selectedSender} • Kultura Guild & Alliance`, icon_url: "https://nolimit.lv/themes/def_theme/images/logo.png" },
                timestamp: new Date().toISOString()
            }]
        };
        await fetch(ATTENDANCE_DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(discordBody) });
        alert("🚀 Official Announcement successfully sent to your Discord channel!");
        document.getElementById('discord-announce-title').value = '';
        document.getElementById('discord-announce-msg').value = '';
    } catch (err) { console.error("Discord Webhook Error:", err); alert("❌ Failed to send announcement to Discord."); }
}

async function sendAttendanceToDiscordChannel(dateKey, eventType, totalPool, presentsCount) {
    if (!ATTENDANCE_DISCORD_WEBHOOK_URL) return;

    let payoutPool = 90000; 
    let raceEventPool = 10000; 
    let solPerMember = presentsCount > 0 ? Math.round(payoutPool / presentsCount) : 0;

    try {
        const discordBody = {
            username: "Kultura Attendance Bot",
            avatar_url: "https://nolimit.lv/themes/def_theme/images/logo.png",
            content: "@everyone 📋 **NEW ATTENDANCE & SOL PAYOUT LOG UPDATED!**",
            embeds: [{
                title: `🛡️ Castle Siege & Event Attendance — ${dateKey}`,
                description: `**Event:** ${eventType}\n**Total Main Present:** ${presentsCount} Warriors\n\n💰 **Total Pool:** ${(payoutPool + raceEventPool).toLocaleString()} SOL\n🔸 **Payout Pool:** ${payoutPool.toLocaleString()} SOL (${solPerMember.toLocaleString()} SOL / ea)\n🏎️ **Race Event Pool:** ${raceEventPool.toLocaleString()} SOL`,
                color: 2303786,
                fields: [
                    {
                        name: "🌐 Quick Website Link",
                        value: "[Click here to open the Kultura Alliance Portal](https://kulturaalliance.pages.dev)",
                        inline: false
                    }
                ],
                footer: { text: "Kultura Guild & Alliance • Attendance System", icon_url: "https://nolimit.lv/themes/def_theme/images/logo.png" },
                timestamp: new Date().toISOString()
            }]
        };

        const res = await fetch(ATTENDANCE_DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordBody)
        });

        if (!res.ok) {
            console.error("Attendance Webhook Failed with Status:", res.status);
        }
    } catch (err) {
        console.error("Attendance Discord Webhook Error:", err);
    }
}

let currentCarRaceRound = 1;
let carRaceAccumulatedWinners = [];

const CAR_KANTYAWAN_PHRASES = [
    "Wooooh! [NAME]'s car is chasing hard! Nitro boost activated?!",
    "And [NAME] overtakes at the curve! Incredible speed!",
    "Flying down the expressway, [NAME]'s car is unstoppable!",
    "Into the lead goes [NAME]! Supercharged engine!",
    "Engine roaring for [NAME]! Closing the gap fast!",
    "No warp drives allowed, [NAME]! Fair race on the speedway!",
    "Exhaust pipe firing up for [NAME]! Nitro sprint visual!",
    "Here comes a fierce battle! [NAME] pushes to the limit!",
    "Sliding through the curve smoothly, [NAME] takes position!",
    "Neck and neck! Can [NAME] reach the finish line first?!"
];
const CAR_ICONS = ["🏎️", "🏎️", "🏎️", "🏎️", "🏎️"];

async function runCarRace() {
    let history = cloudAttendanceHistory ? [...cloudAttendanceHistory] : [];
    const csRecords = history.filter(r => r.event === "Castle Siege War").slice(0, 3);
    
    if (csRecords.length < 3) {
        alert(`⚠️ Requires at least 3 recorded Castle Siege War events! Currently only have ${csRecords.length} CS events in database.`);
        return;
    }

    let latestCS = csRecords[0];
    let csMainCounts = {};
    csRecords.forEach(rec => {
        if (rec.presents) {
            let uniqueMainsInEvent = new Set();
            rec.presents.forEach(p => {
                let mainKey = (p.name || "").toLowerCase().trim();
                if (mainKey) uniqueMainsInEvent.add(mainKey);
            });
            uniqueMainsInEvent.forEach(mKey => { csMainCounts[mKey] = (csMainCounts[mKey] || 0) + 1; });
        }
    });

    let qualifiedMains = Object.keys(csMainCounts).filter(mKey => {
        let isGm = GUILD_MASTERS_LIST.some(gm => gm.toLowerCase() === mKey);
        return csMainCounts[mKey] === 3 && !isGm;
    });

    if (qualifiedMains.length < 6) {
        alert(`⚠️ Not enough eligible members! Only ${qualifiedMains.length} qualified non-GM members completed 3/3 CS attendance.`);
        return;
    }

    if (currentCarRaceRound === 1) { carRaceAccumulatedWinners = []; }
    let remainingParticipants = qualifiedMains.filter(mKey => !carRaceAccumulatedWinners.includes(mKey));
    if (remainingParticipants.length === 0) { alert("⚠️ All eligible members have already won!"); return; }

    const infoElem = document.getElementById('giveaway-participants-info');
    const resultsBox = document.getElementById('giveaway-results-box');
    const winnersList = document.getElementById('giveaway-winners-list');
    const arena = document.getElementById('duck-race-arena');
    const lanesContainer = document.getElementById('duck-lanes-container');
    const startBtn = document.getElementById('start-duck-race-btn');
    const timerDisplay = document.getElementById('duck-race-timer-display');
    const kantyawanBox = document.getElementById('kantyawan-box');

    startBtn.disabled = true;
    arena.style.display = 'block';
    arena.scrollIntoView({ behavior: 'smooth', block: 'center' });

    lanesContainer.innerHTML = '';
    let carElements = [];

    remainingParticipants.forEach((dKey, idx) => {
        let carDriverName = getOriginalCasedMainName(dKey);
        let carIcon = CAR_ICONS[idx % CAR_ICONS.length];

        let lane = document.createElement('div');
        lane.className = 'car-lane-row';
        lane.innerHTML = `
            <div class="car-lane-name">🏎️ ${carDriverName}</div>
            <div class="car-track-area">
                <div class="finish-line-flag"></div>
                <div class="racing-car-icon" id="car-${idx}">${carIcon}</div>
            </div>
        `;
        lanesContainer.appendChild(lane);
        carElements.push({ key: dKey, name: carDriverName, pos: 0, baseSpeed: 0.17 + (Math.random() * 0.04), elem: document.getElementById(`car-${idx}`) });
    });

    infoElem.innerHTML = `🏁 <strong>ROUND ${currentCarRaceRound} OF 6 IN PROGRESS (45s CAR SPRINT)!</strong> ALL ${remainingParticipants.length} RACERS ON SCREEN! 🏎️💨`;

    const TOTAL_DURATION_SEC = 45;
    let startTime = Date.now();
    let lastShoutTime = startTime;
    let startMsg = `Attention drivers! Red light is on! Three, two, one, GO! Sprinting down the expressway!`;
    kantyawanBox.innerHTML = `🎙️ 🔊 ${startMsg}`;
    speakKantyawanText(startMsg);

    let raceInterval = setInterval(() => {
        let elapsedSec = (Date.now() - startTime) / 1000;
        let remainingSec = Math.max(0, Math.ceil(TOTAL_DURATION_SEC - elapsedSec));

        if (timerDisplay) { timerDisplay.innerText = `⏱️ Time Remaining: ${remainingSec}s`; }

        if (Date.now() - lastShoutTime > 4000 && remainingSec > 3) {
            lastShoutTime = Date.now();
            let randomCar = carElements[Math.floor(Math.random() * carElements.length)];
            let randomPhrase = CAR_KANTYAWAN_PHRASES[Math.floor(Math.random() * CAR_KANTYAWAN_PHRASES.length)];
            let shoutText = randomPhrase.replace("[NAME]", randomCar.name);
            kantyawanBox.innerHTML = `<span class="kantyawan-bubble">🎙️ 🔊 ${shoutText}</span>`;
            speakKantyawanText(shoutText);
        }

        let winnerFound = false;
        carElements.forEach(car => {
            car.pos += (car.baseSpeed * (1 + (Math.random() * 0.8 - 0.3)));
            if (car.pos >= 92 || elapsedSec >= TOTAL_DURATION_SEC) {
                if (car.pos >= 92) winnerFound = true;
            }
            car.elem.style.left = `${Math.min(92, car.pos)}%`;
        });

        if (winnerFound || elapsedSec >= TOTAL_DURATION_SEC) {
            clearInterval(raceInterval);
            carElements.sort((a, b) => b.pos - a.pos);
            let roundWinner = carElements[0];
            roundWinner.pos = 92;
            roundWinner.elem.style.left = '92%';

            carRaceAccumulatedWinners.push(roundWinner.key);
            latestCS.giveawayWinners = carRaceAccumulatedWinners;
            let recordIndex = history.findIndex(r => r.dateKey === latestCS.dateKey && r.event === "Castle Siege War");
            if (recordIndex !== -1) {
                history[recordIndex] = latestCS;
                cloudAttendanceHistory = history;
                if (window.database) { window.dbSet(window.dbRef(window.database, 'kultura_attendance'), history); }
            }

            resultsBox.style.display = 'block';
            winnersList.innerHTML = '';
            let publicWinnersHtml = '';

            carRaceAccumulatedWinners.forEach((wKey, i) => {
                let wName = getOriginalCasedMainName(wKey);
                let mainDiv = findMainGuildDivision(wName) || "Kultura Alliance";
                winnersList.innerHTML += `
                    <div style="background: rgba(0,0,0,0.6); border: 1px solid var(--primary); padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.9rem; color: #ff99dd; font-weight: bold;">🏆 Round ${i+1} Winner</div>
                        <div style="color: #ffdd55; font-weight: bold; font-size: 1rem; margin: 3px 0;">🏎️ ${wName}</div>
                        <div style="font-size: 0.75rem; color: #33cc33;">${mainDiv}</div>
                    </div>
                `;
                publicWinnersHtml += `🏎️ <strong>Round ${i+1} Winner: ${wName}</strong> <span style="color: #33cc33;">(${mainDiv})</span><br>`;
            });

            const publicWinnersBox = document.getElementById('public-winners-display-box');
            if (publicWinnersBox) publicWinnersBox.innerHTML = publicWinnersHtml;

            let victoryMessage = `And across the finish line! The champion of round ${currentCarRaceRound} is driver ${roundWinner.name}!`;
            kantyawanBox.innerHTML = `🎉 🎙️ 🔊 ${victoryMessage} 🎉`;
            speakKantyawanText(victoryMessage);

            if (currentCarRaceRound < 6) {
                currentCarRaceRound++;
                startBtn.innerText = `🏎️ START ROUND ${currentCarRaceRound} OF 6 (WITH LIVE ANNOUNCER VOICE)`;
                startBtn.disabled = false;
                infoElem.innerHTML = `🎉 <strong>ROUND ${currentCarRaceRound - 1} WINNER: ${roundWinner.name}!</strong> Click below to start Round ${currentCarRaceRound}!`;
            } else {
                currentCarRaceRound = 1;
                startBtn.innerText = `🏎️ START NEW GRAND PRIX CAR TOURNAMENT (ROUND 1)`;
                startBtn.disabled = false;
                infoElem.innerHTML = `🏆 <strong>ALL 6 CAR RACE ROUNDS COMPLETED! CONGRATULATIONS TO ALL CHAMPIONS!</strong> 🏆`;
            }
        }
    }, 100);
}

function updateLiveActiveWarriors() {
    const countElem = document.getElementById('active-warriors-count');
    if (!countElem) return;
    let history = cloudAttendanceHistory ? cloudAttendanceHistory : [];
    let latestCS = history.find(r => r.event === "Castle Siege War");
    if (latestCS && latestCS.presents && latestCS.presents.length > 0) {
        countElem.innerText = `${latestCS.presents.length}`;
    } else {
        let data = getGuildData();
        let totalMembers = 0;
        for (let divKey in data) { if (Array.isArray(data[divKey])) { totalMembers += data[divKey].length; } }
        countElem.innerText = totalMembers > 0 ? `${totalMembers}+` : "95+";
    }
}

function calculate3DayPayoutData() {
    let history = cloudAttendanceHistory ? [...cloudAttendanceHistory] : [];
    if (history.length === 0) return null;
    let last3Records = history.slice(0, 3);
    let includedDates = last3Records.map(r => r.dateKey);
    let mainMap = {};

    last3Records.forEach(rec => {
        let totalPresent = rec.presents ? rec.presents.length : 0;
        let payoutPool = 90000; 
        let solShare = totalPresent > 0 ? Math.round(payoutPool / totalPresent) : 0;
        if (rec.presents) {
            rec.presents.forEach(p => {
                let mainIgn = getOriginalCasedMainName((p.name || "").toLowerCase().trim()) || p.name;
                let divKey = findMainGuildDivision(mainIgn) || (p.officer || "Kultura Main Division");
                if (!mainMap[mainIgn]) {
                    mainMap[mainIgn] = { name: mainIgn, division: divKey, count: 0, totalSol: 0, datesPresent: [] };
                }
                mainMap[mainIgn].count += 1;
                mainMap[mainIgn].totalSol += solShare;
                mainMap[mainIgn].datesPresent.push(rec.dateKey);
            });
        }
    });
    return { includedDates: includedDates, totalDaysCount: last3Records.length, members: Object.values(mainMap) };
}

function open3DaySummaryModal() {
    const data = calculate3DayPayoutData();
    const datesElem = document.getElementById('summary-3day-dates');
    const tbody = document.getElementById('summary-3day-table-body');

    if (!data || data.members.length === 0) {
        datesElem.innerText = "No recorded attendance logs found in the database.";
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-dim);">No 3-Day Attendance records found.</td></tr>`;
    } else {
        cached3DayPayoutData = data;
        datesElem.innerHTML = `Included Dates (${data.totalDaysCount} Events): <span style="color:#fff;">${data.includedDates.join(' | ')}</span>`;
        tbody.innerHTML = '';
        data.members.sort((a, b) => a.division.localeCompare(b.division) || a.name.localeCompare(b.name));
        data.members.forEach(m => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = "1px solid rgba(255,255,255,0.08)";
            tr.innerHTML = `
                <td style="padding: 8px; font-weight: bold; color: #fff;">${m.name}</td>
                <td style="padding: 8px; color: var(--primary-glow); font-size: 0.8rem;">${m.division}</td>
                <td style="padding: 8px; text-align: center; color: #33cc33; font-weight: bold;">${m.count} / ${data.totalDaysCount}</td>
                <td style="padding: 8px; text-align: right; color: #ffdd55; font-weight: bold;">${m.totalSol.toLocaleString()} SOL</td>
            `;
            tbody.appendChild(tr);
        });
    }
    document.getElementById('summary-3day-modal').style.display = 'flex';
}

function close3DaySummaryModal() { document.getElementById('summary-3day-modal').style.display = 'none'; }

function downloadCleanPayoutTxt() {
    const data = cached3DayPayoutData || calculate3DayPayoutData();
    if (!data || data.members.length === 0) { alert("⚠️ No data available to export into file!"); return; }

    let fileContent = `==================================================\n`;
    fileContent += `   KULTURA GUILD & ALLIANCE - 3-DAY PAYOUT SUMMARY\n`;
    fileContent += `==================================================\n`;
    fileContent += `Generated Date: ${new Date().toLocaleDateString()}\n`;
    fileContent += `Included Dates: ${data.includedDates.join(' | ')}\n\n`;
    fileContent += `--------------------------------------------------\n`;
    fileContent += `MAIN CHARACTER        TOTAL DAYS    TOTAL SOL SHARE\n`;
    fileContent += `--------------------------------------------------\n`;

    let grouped = {};
    data.members.forEach(m => {
        if (!grouped[m.division]) grouped[m.division] = [];
        grouped[m.division].push(m);
    });

    for (let divName in grouped) {
        fileContent += `\n[ ${divName.toUpperCase()} ]\n`;
        grouped[divName].forEach(m => {
            let padName = m.name.padEnd(22, ' ');
            let padCount = `${m.count}/${data.totalDaysCount}`.padEnd(14, ' ');
            let solStr = `${m.totalSol.toLocaleString()} SOL`;
            fileContent += `${padName}${padCount}${solStr}\n`;
        });
    }

    fileContent += `\n==================================================\n`;
    fileContent += `TOTAL WARRIORS IN PAYOUT: ${data.members.length}\n`;
    fileContent += `==================================================\n`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Kultura_3Day_Payout_${getStandardDateKey()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function openLoginModal() {
    if (currentLoggedInOfficer) { openAdminModal(); return; }
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-modal').style.display = 'flex';
}

function closeLoginModal() { document.getElementById('login-modal').style.display = 'none'; }

async function handleLogin() {
    const userVal = document.getElementById('login-username').value.trim();
    const passVal = document.getElementById('login-password').value.trim();
    let loginEmail = userVal;
    if (!userVal.includes('@')) { loginEmail = `${userVal.toLowerCase()}@alliance.com`; }

    try {
        await window.signInWithEmailAndPassword(window.auth, loginEmail, passVal);
        currentLoggedInOfficer = userVal.includes('@') ? userVal.split('@')[0] : userVal;
        localStorage.setItem('kultura_logged_officer', currentLoggedInOfficer);
        alert(`✅ Welcome ${currentLoggedInOfficer}! Successfully authenticated.`);
        closeLoginModal();
        updatePortalButtonUI();
        openAdminModal();
        resetInactivityTimer();
    } catch (error) {
        console.error(error);
        alert("❌ Invalid Email/Username or Password! Please try again.");
    }
}

async function handleLogout() {
    try { if (window.auth) { await window.signOut(window.auth); } } catch(e) {}
    currentLoggedInOfficer = null;
    localStorage.removeItem('kultura_logged_officer');
    clearTimeout(inactivityTimer);
    closeAdminModal();
    updatePortalButtonUI();
    alert("🔒 Successfully Logged Out.");
}

function toggleAdminSection(sectionId) {
    const elem = document.getElementById(sectionId);
    const iconElem = document.getElementById(`icon-${sectionId}`);
    if (elem.style.display === "block") {
        elem.style.display = "none";
        if (iconElem) iconElem.innerText = "▼ Expand";
    } else {
        elem.style.display = "block";
        if (iconElem) iconElem.innerText = "▲ Hide";
    }
}

function toggleMinimizeAdminModal() {
    const modalOverlay = document.getElementById('attendance-admin-modal');
    const bodyContent = document.getElementById('admin-modal-body-content');
    const minBtn = document.getElementById('modal-min-btn');
    const modalCard = document.getElementById('admin-modal-card');

    if (bodyContent.style.display === "none") {
        bodyContent.style.display = "block";
        minBtn.innerText = "➖";
        modalCard.style.maxHeight = "90vh";
        modalCard.style.width = "95%";
        modalCard.style.maxWidth = "800px";
        modalCard.style.position = "relative";
        modalCard.style.bottom = "auto";
        modalCard.style.right = "auto";
        modalOverlay.style.background = "rgba(0,0,0,0.85)";
        modalOverlay.style.justifyContent = "center";
        modalOverlay.style.alignItems = "center";
        modalOverlay.style.pointerEvents = "auto";
    } else {
        bodyContent.style.display = "none";
        minBtn.innerText = "🗖";
        modalCard.style.maxHeight = "auto";
        modalCard.style.width = "300px";
        modalCard.style.maxWidth = "300px";
        modalCard.style.position = "fixed";
        modalCard.style.bottom = "20px";
        modalCard.style.right = "20px";
        modalOverlay.style.background = "transparent";
        modalOverlay.style.justifyContent = "flex-end";
        modalOverlay.style.alignItems = "flex-end";
        modalOverlay.style.pointerEvents = "none";
    }
}

function addMoreDummyBox() {
    const container = document.getElementById('dummy-boxes-container');
    const totalCurrent = container.querySelectorAll('.dummy-input-field').length;
    const newInput = document.createElement('input');
    newInput.type = "text";
    newInput.className = "dummy-input-field";
    newInput.placeholder = `Dummy ${totalCurrent + 1}`;
    newInput.style.cssText = "padding: 7px; background: #111; border: 1px solid #555; color: #fff; border-radius: 4px; font-size: 0.8rem;";
    container.appendChild(newInput);
}

async function saveSuperAdminMultiLinkage() {
    const mainIgnInput = document.getElementById('type-main-ign').value.trim();
    const dummyInputs = document.querySelectorAll('.dummy-input-field');

    if (!mainIgnInput) { alert("⚠️ Please type the Main Character IGN first!"); return; }

    let dummyList = [];
    dummyInputs.forEach(input => {
        let val = input.value.trim();
        if (val && val.toLowerCase() !== mainIgnInput.toLowerCase()) { dummyList.push(val); }
    });

    if (dummyList.length === 0) { alert("⚠️ Enter at least one Dummy IGN in the boxes!"); return; }

    let data = getGuildData();
    let canonicalMainIgn = null;

    for (let divKey in data) {
        let foundMain = data[divKey].find(m => m.name.toLowerCase() === mainIgnInput.toLowerCase());
        if (foundMain) { canonicalMainIgn = foundMain.name; break; }
    }

    if (!canonicalMainIgn) {
        alert(`⚠️ The Main Character "${mainIgnInput}" was not found in any Roster Division.`);
        return;
    }

    let linkedCount = 0;
    let missingDummies = [];

    dummyList.forEach(dummyIgn => {
        let foundDummyObj = null;
        for (let divKey in data) {
            let member = data[divKey].find(m => m.name.toLowerCase() === dummyIgn.toLowerCase());
            if (member) { foundDummyObj = member; break; }
        }
        if (foundDummyObj) {
            foundDummyObj.mainOwner = canonicalMainIgn;
            foundDummyObj.icon = '🎭';
            linkedCount++;
        } else {
            missingDummies.push(dummyIgn);
        }
    });

    if (linkedCount > 0) {
        await saveGuildData(data);
        alert(`🎉 Successfully linked ${linkedCount} Dummy Accounts to Main "${canonicalMainIgn}"!`);
        document.getElementById('type-main-ign').value = '';
        dummyInputs.forEach(i => i.value = '');
        renderRosters();
        onDivisionChange();
        document.getElementById('search-main-input').value = canonicalMainIgn;
        searchMainAndDummies();
    } else {
        alert(`⚠️ No accounts linked! Ensure the Dummy Accounts are registered in the Roster first.`);
    }
}

async function registerNewMember() {
    if (!currentLoggedInOfficer) return;
    const ign = document.getElementById('new-member-ign').value.trim();
    const charClass = document.getElementById('new-member-class').value;
    const assignedDivision = document.getElementById('admin-officer-select').value;

    if (!ign) { alert("⚠️ Please enter the Member IGN!"); return; }

    let data = getGuildData();
    let membersList = data[assignedDivision] || [];
    if (membersList.some(m => m.name.toLowerCase() === ign.toLowerCase())) {
        alert("⚠️ This IGN is already registered in the roster!");
        return;
    }

    const newMemberObj = { name: ign, class: charClass, icon: getClassIcon(charClass), mainOwner: ign };
    membersList.push(newMemberObj);
    data[assignedDivision] = membersList;

    await saveGuildData(data);
    alert(`🎉 Success! Registered ${ign} (${charClass}) to ${assignedDivision}.`);
    document.getElementById('new-member-ign').value = '';
    renderRosters();
    onDivisionChange();
}

function renderMemberChecklist() {
    if (!currentLoggedInOfficer) return;
    const selectedDivision = document.getElementById('admin-officer-select').value;
    const eventType = document.getElementById('admin-event-type').value;
    const checklist = document.getElementById('admin-member-checklist');
    checklist.innerHTML = '';

    const data = getGuildData();
    const members = data[selectedDivision] || [];
    const targetDateKey = getStandardDateKey();
    let currentRecord = cloudAttendanceHistory ? cloudAttendanceHistory.find(r => r.dateKey === targetDateKey && r.event === eventType) : null;
    let presentMainsSet = new Set(currentRecord && currentRecord.presents ? currentRecord.presents.map(p => (p.name || "").toLowerCase()) : []);

    members.forEach((mObj) => {
        const div = document.createElement('div');
        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;";
        
        let mainOwnerVal = mObj.mainOwner || mObj.name;
        let isDummy = mainOwnerVal.toLowerCase() !== mObj.name.toLowerCase();
        let dummyLabel = isDummy ? `<small style="color:#ffaa33; font-weight:bold;">[Dummy of ${mainOwnerVal}]</small>` : `<small style="color:#33cc33; font-weight:bold;">[Main]</small>`;
        let isCurrentlyPresent = presentMainsSet.has(mainOwnerVal.toLowerCase());

        div.innerHTML = `
            <span>${mObj.icon} <strong>${mObj.name}</strong> ${dummyLabel} <small style="color:var(--text-dim);">(${mObj.class})</small></span>
            <select data-name="${mObj.name}" data-main="${mainOwnerVal}" style="background: #222; color: #fff; border: 1px solid #555; padding: 2px 6px; border-radius: 3px;">
                <option value="Present" ${isCurrentlyPresent ? 'selected' : ''}>Present</option>
                <option value="Late">Late</option>
                <option value="Absent" ${!isCurrentlyPresent ? 'selected' : ''}>Absent</option>
            </select>
        `;
        checklist.appendChild(div);
    });
}

function findMainGuildDivision(mainIgn) {
    let lowerMain = (mainIgn || "").toLowerCase().trim();

    if (lowerMain === "fullclip") return "Fullclip Division (Fullclip)";
    if (lowerMain === "warlock") return "Warlock Division (Warlock)";
    if (lowerMain === "lorddwight") return "STEALTH Division (LordDwight)";
    if (lowerMain === "windtalker") return "PROTECT Division (Windtalker)";
    if (lowerMain === "ikapitana") return "ANXIETY Division (iKapitana)";

    const data = getGuildData();
    for (let divKey in data) {
        let found = data[divKey].find(m => 
            (m.mainOwner || m.name).toLowerCase().trim() === lowerMain || 
            m.name.toLowerCase().trim() === lowerMain
        );
        if (found) return divKey;
    }
    return null;
}

async function saveAttendanceEntry() {
    if (!currentLoggedInOfficer) return;
    const currentCheckingGM = document.getElementById('admin-officer-select').value;
    const eventType = document.getElementById('admin-event-type').value;
    const totalSolPool = parseFloat(document.getElementById('admin-sol-pool').value) || 100000;
    const selects = document.querySelectorAll('#admin-member-checklist select');
    
    const targetDateKey = getStandardDateKey(); 
    let allRecords = cloudAttendanceHistory ? [...cloudAttendanceHistory] : [];
    let existingRecordIndex = allRecords.findIndex(r => r.dateKey === targetDateKey && r.event === eventType);
    let existingRecord = existingRecordIndex !== -1 ? allRecords[existingRecordIndex] : null;

    if (!existingRecord) {
        existingRecord = { dateKey: targetDateKey, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: eventType, solPool: totalSolPool, presents: [] };
        allRecords.unshift(existingRecord);
    }

    let currentDivMembers = (getGuildData()[currentCheckingGM] || []).map(m => (m.mainOwner || m.name).toLowerCase());
    let updatedPresents = existingRecord.presents.filter(p => !currentDivMembers.includes((p.name || "").toLowerCase()));
    let acknowledgedMains = new Set(updatedPresents.map(p => (p.name || "").toLowerCase()));

    selects.forEach(sel => {
        const status = sel.value;
        const mainChar = sel.getAttribute('data-main');
        const loggedChar = sel.getAttribute('data-name');

        if (status === 'Present' || status === 'Late') {
            if (!acknowledgedMains.has(mainChar.toLowerCase())) {
                acknowledgedMains.add(mainChar.toLowerCase());
                let registeredMainGuild = findMainGuildDivision(mainChar);
                let targetDivisionForDisplay = registeredMainGuild ? registeredMainGuild : currentCheckingGM;
                updatedPresents.push({ name: mainChar, loggedIgn: loggedChar, officer: targetDivisionForDisplay });
            }
        }
    });

    existingRecord.presents = updatedPresents;
    existingRecord.solPool = totalSolPool;
    existingRecord.timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    cloudAttendanceHistory = allRecords;
    if (window.database) { await window.dbSet(window.dbRef(window.database, 'kultura_attendance'), allRecords); }
    
    await sendAttendanceToDiscordChannel(targetDateKey, eventType, totalSolPool, updatedPresents.length);

    renderAttendanceHistory();
    renderAdminAttendanceLogList();
    updateLiveActiveWarriors();
    updatePublicGiveawayDisplay();
    alert(`🎉 Live Attendance Updated successfully for date: ${targetDateKey}!`);
}

function renderAttendanceHistory() {
    const tbody = document.getElementById('public-attendance-history');
    let history = cloudAttendanceHistory ? cloudAttendanceHistory : [];

    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 10px; text-align: center; color: var(--text-dim);">No attendance recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    history.forEach(rec => {
        const totalPresent = rec.presents ? rec.presents.length : 0;
        let payoutPool = 90000; 
        const solPerMember = totalPresent > 0 ? Math.round(payoutPool / totalPresent).toLocaleString() : 0;
        
        const groupedByDivision = {};
        if (rec.presents) {
            rec.presents.forEach(p => {
                let normalizedMainName = getOriginalCasedMainName((p.name || "").toLowerCase().trim()) || p.name;
                let verifiedDivision = findMainGuildDivision(normalizedMainName);
                let finalDivKey = verifiedDivision ? verifiedDivision : (p.officer || "Kultura Main Division");

                if (!groupedByDivision[finalDivKey]) { groupedByDivision[finalDivKey] = []; }
                groupedByDivision[finalDivKey].push({ ...p, name: normalizedMainName });
            });
        }

        let formattedMembersHTML = '';
        if (totalPresent > 0) {
            for (let divName in groupedByDivision) {
                formattedMembersHTML += `<div class="division-group-title">👑 ${divName} (${groupedByDivision[divName].length} Mains Present):</div><br>`;
                groupedByDivision[divName].forEach(pObj => {
                    let altNote = (pObj.loggedIgn && pObj.loggedIgn.toLowerCase() !== pObj.name.toLowerCase()) ? ` <small style="color:#ffaa33;">(Attended via Dummy ${pObj.loggedIgn})</small>` : '';
                    formattedMembersHTML += `💎 <strong>${pObj.name}</strong>${altNote} — <span style="color:var(--primary-glow);">${solPerMember} SOL</span><br>`;
                });
                formattedMembersHTML += `<div style="margin-bottom:6px;"></div>`;
            }
        } else {
            formattedMembersHTML = '<span style="color:var(--text-dim);">No attendance records found.</span>';
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid rgba(255,255,255,0.08)";
        tr.innerHTML = `
            <td style="padding: 10px; color: var(--text-dim); white-space: nowrap;">${rec.dateKey}<br><small>Last updated: ${rec.timestamp}</small></td>
            <td style="padding: 10px; font-weight: 600; color:var(--primary);">${rec.event}</td>
            <td style="padding: 10px; color: #ffdd55; font-weight: bold;">${totalPresent} Main Warriors</td>
            <td style="padding: 10px; color: #ffdd55;">${rec.solPool.toLocaleString()} SOL<br><span style="color:#33cc33; font-weight:bold;">${solPerMember} SOL / ea</span></td>
            <td style="padding: 10px; color: #33cc33; line-height: 1.5;">${formattedMembersHTML}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAdminAttendanceLogList() {
    const listContainer = document.getElementById('admin-attendance-logs-list');
    if (!listContainer) return;
    let history = cloudAttendanceHistory ? cloudAttendanceHistory : [];

    if (history.length === 0) {
        listContainer.innerHTML = `<span style="color: var(--text-dim);">No reserved attendance logs.</span>`;
        return;
    }

    listContainer.innerHTML = '';
    history.forEach((rec, index) => {
        const totalPresent = rec.presents ? rec.presents.length : 0;
        const div = document.createElement('div');
        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 6px; margin-bottom: 6px; background: rgba(0,0,0,0.5); border-left: 3px solid var(--primary); border-radius: 4px;";
        div.innerHTML = `
            <div>
                <strong>📅 ${rec.dateKey}</strong> - <span style="color:var(--primary-glow);">${rec.event}</span><br>
                <small style="color:var(--text-dim);">Presents: ${totalPresent} Members | Pool: ${rec.solPool.toLocaleString()} SOL</small>
            </div>
            <button onclick="deleteAttendanceLog(${index})" class="delete-btn" style="padding: 4px 8px;">❌ Delete Log</button>
        `;
        listContainer.appendChild(div);
    });
}

async function deleteAttendanceLog(logIndex) {
    let history = cloudAttendanceHistory ? [...cloudAttendanceHistory] : [];
    if (logIndex < 0 || logIndex >= history.length) return;
    const targetLog = history[logIndex];
    const confirmDelete = confirm(`⚠️ Are you sure you want to delete the attendance log on "${targetLog.dateKey}" (${targetLog.event})?`);

    if (confirmDelete) {
        history.splice(logIndex, 1);
        cloudAttendanceHistory = history;
        if (window.database) { await window.dbSet(window.dbRef(window.database, 'kultura_attendance'), cloudAttendanceHistory); }
        renderAttendanceHistory();
        renderAdminAttendanceLogList();
        updateLiveActiveWarriors();
        updatePublicGiveawayDisplay();
        alert(`🗑️ Attendance log record permanently deleted!`);
    }
}

async function changeMyUsername() {
    if (!currentLoggedInOfficer) return;
    const newUsername = document.getElementById('change-username-new').value.trim();
    if (!newUsername) return;

    const oldUserKey = currentLoggedInOfficer;
    currentLoggedInOfficer = newUsername;
    localStorage.setItem('kultura_logged_officer', currentLoggedInOfficer);

    let data = getGuildData();
    let oldDivKey = `${oldUserKey} Division (${oldUserKey})`;
    let newDivKey = `${newUsername} Division (${newUsername})`;

    if (data[oldDivKey]) {
        data[newDivKey] = data[oldDivKey];
        delete data[oldDivKey];
    }

    ALL_DIVISIONS = Object.keys(data);
    if (window.database) { await saveGuildData(data); }
    alert(`🎉 Username changed successfully to "${newUsername}".`);
    document.getElementById('change-username-new').value = '';
    renderRosters();
    openAdminModal();
    updatePortalButtonUI();
}

async function changeMyPassword() {
    if (!currentLoggedInOfficer) return;
    alert(`🎉 Password update requested.`);
    document.getElementById('change-pass-current').value = '';
    document.getElementById('change-pass-new').value = '';
}

function renderSuperAdminInbox() {
    const inboxList = document.getElementById('superadmin-inbox-list');
    if (!inboxList) return;
    if (cloudResetTickets.length === 0) {
        inboxList.innerHTML = `<span style="color: var(--text-dim);">No reserved tickets in the inbox.</span>`;
        return;
    }
    inboxList.innerHTML = '';
    cloudResetTickets.forEach(ticket => {
        const div = document.createElement('div');
        div.style.cssText = "padding: 6px; margin-bottom: 6px; background: rgba(0,0,0,0.5); border-left: 3px solid #ff3333; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;";
        div.innerHTML = `<div><strong>👤 ${ticket.username}</strong> <small style="color:var(--text-dim);">(${ticket.timestamp})</small><br><span style="color:#ffdd55;">💬 "${ticket.message}"</span></div><button onclick="resolveTicket(${ticket.id}, '${ticket.username}')" class="btn" style="padding: 4px 8px; font-size: 0.7rem; background: #33cc33; color: #000;">✅ Done</button>`;
        inboxList.appendChild(div);
    });
}

async function resolveTicket(ticketId) {
    cloudResetTickets = cloudResetTickets.filter(t => t.id !== ticketId);
    if (window.database) { await window.dbSet(window.dbRef(window.database, 'kultura_reset_tickets'), cloudResetTickets); }
    renderSuperAdminInbox();
}

async function registerAllianceAndGM() {
    const guildName = document.getElementById('reg-guild-name').value.trim();
    const gmClass = document.getElementById('reg-gm-class').value;
    if (!guildName) return;

    const gmUser = guildName;
    const divisionKey = `${guildName} Division (${gmUser})`;

    PROTECTED_ADMIN_ACCOUNTS.push(gmUser.toLowerCase());
    GUILD_MASTERS_LIST.push(gmUser.toLowerCase());

    let data = getGuildData();
    data[divisionKey] = [{ name: gmUser, class: gmClass, icon: "👑", mainOwner: gmUser }];

    ALL_DIVISIONS = Object.keys(data);
    if (window.database) { await saveGuildData(data); }
    alert(`🎉 Alliance "${guildName}" created and added to Roster!`);
    renderRosters();
    openAdminModal();
}

function openAdminModal() {
    if (!currentLoggedInOfficer) { openLoginModal(); return; }
    document.getElementById('logged-agm-display').innerText = `${currentLoggedInOfficer}`;

    const datePicker = document.getElementById('admin-attendance-date');
    if (datePicker && !datePicker.value) {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        datePicker.value = `${year}-${month}-${day}`;
    }

    const superInboxBlock = document.getElementById('superadmin-inbox-block');
    const superMainDummyBlock = document.getElementById('superadmin-main-dummy-block');
    const superDeleteLogsBlock = document.getElementById('superadmin-delete-logs-block');
    const superGuildRegBlock = document.getElementById('superadmin-guild-reg-block');
    const superEventsBlock = document.getElementById('superadmin-events-block');
    const superAuctionBlock = document.getElementById('superadmin-auction-block');

    let currentLower = currentLoggedInOfficer.toLowerCase();
    let isSuperAdmin = (currentLower === "fullclip" || currentLower === "kultura" || currentLower === "kulturamain");
    let isIkapitana = (currentLower === "ikapitana");

    if (isSuperAdmin) {
        superInboxBlock.style.display = 'block';
        superDeleteLogsBlock.style.display = 'block';
        superGuildRegBlock.style.display = 'block';
        if (superEventsBlock) superEventsBlock.style.display = 'block';
        if (superAuctionBlock) superAuctionBlock.style.display = 'block';
        renderSuperAdminInbox();
        renderAdminAttendanceLogList();
        populateEventsAdminForm();
        loadPendingMarketAccounts();
        renderAdminAuctionList();
    } else {
        superInboxBlock.style.display = 'none';
        superDeleteLogsBlock.style.display = 'none';
        superGuildRegBlock.style.display = 'none';
        if (superEventsBlock) superEventsBlock.style.display = 'none';
        if (superAuctionBlock) superAuctionBlock.style.display = 'none';
    }

    updateGiveawayBotVisibility();
    superMainDummyBlock.style.display = isIkapitana ? 'none' : 'block';

    const selectDiv = document.getElementById('admin-officer-select');
    selectDiv.innerHTML = '';
    let matchedDivisions = [];
    let allAvailDivs = Object.keys(getGuildData());

    if (isSuperAdmin) {
        matchedDivisions = allAvailDivs;
        selectDiv.disabled = false;
    } else {
        matchedDivisions = allAvailDivs.filter(divName => divName.toLowerCase().includes(currentLower));
        if (matchedDivisions.length === 0) { matchedDivisions = allAvailDivs; selectDiv.disabled = false; }
        else { selectDiv.disabled = true; }
    }

    matchedDivisions.forEach(divName => { selectDiv.innerHTML += `<option value="${divName}">${divName}</option>`; });
    onDivisionChange();

    const modalOverlay = document.getElementById('attendance-admin-modal');
    const modalCard = document.getElementById('admin-modal-card');
    modalOverlay.style.background = "rgba(0,0,0,0.85)";
    modalOverlay.style.justifyContent = "center";
    modalOverlay.style.alignItems = "center";
    modalOverlay.style.pointerEvents = "auto";
    modalCard.style.width = "95%";
    modalCard.style.maxWidth = "800px";
    modalCard.style.position = "relative";
    modalCard.style.bottom = "auto";
    modalCard.style.right = "auto";
    document.getElementById('admin-modal-body-content').style.display = 'block';
    document.getElementById('modal-min-btn').innerText = "➖";
    modalOverlay.style.display = 'flex';
}

function onDivisionChange() {
    renderDeleteMemberList();
    renderMemberChecklist();
}

function getClassIcon(className) {
    switch(className) {
        case 'Summoner': return '✨';
        case 'Blade Master': return '⚔️';
        case 'Elf': return '🏹';
        case 'Dark Lord': return '♛';
        case 'Dimension Master': return '🌌';
        case 'Soul Master': return '🌠';
        default: return '🛡️';
    }
}

function getClassCss(className) {
    switch(className) {
        case 'Summoner': return 'class-summoner';
        case 'Blade Master': return 'class-blademaster';
        case 'Elf': return 'class-elf';
        case 'Dark Lord': return 'class-darklord';
        case 'Dimension Master': return 'class-dimensionmaster';
        case 'Soul Master': return 'class-soulmaster';
        default: return '';
    }
}

function renderDeleteMemberList() {
    if (!currentLoggedInOfficer) return;
    const selectedDivision = document.getElementById('admin-officer-select').value;
    const listContainer = document.getElementById('admin-delete-member-list');
    listContainer.innerHTML = '';

    const data = getGuildData();
    const members = data[selectedDivision] || [];

    members.forEach(mObj => {
        const isProtected = PROTECTED_ADMIN_ACCOUNTS.includes(mObj.name.toLowerCase());
        const div = document.createElement('div');
        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;";
        
        const actionHTML = isProtected 
            ? `<span style="font-size:0.75rem; color:#e6b800; font-weight:bold; background:rgba(230,184,0,0.15); padding:2px 6px; border-radius:3px; border:1px solid #e6b800;">🛡️ Protected</span>`
            : `<button onclick="deleteMember('${mObj.name}')" class="delete-btn">❌ Delete</button>`;

        let mainOwnerVal = mObj.mainOwner || mObj.name;
        let altTag = mainOwnerVal.toLowerCase() !== mObj.name.toLowerCase() ? ` <small style="color:#ffaa33;">(Dummy of ${mainOwnerVal})</small>` : ' <small style="color:#33cc33;">(Main)</small>';

        div.innerHTML = `<span>${mObj.icon} <strong>${mObj.name}</strong>${altTag} <small style="color:var(--text-dim);">(${mObj.class})</small></span>${actionHTML}`;
        listContainer.appendChild(div);
    });
}

async function deleteMember(memberName) {
    if (!currentLoggedInOfficer) return;
    const confirmDel = confirm(`⚠️ Are you sure you want to remove "${memberName}" from the roster?`);
    if (!confirmDel) return;

    const selectedDivision = document.getElementById('admin-officer-select').value;
    let data = getGuildData();
    if (data[selectedDivision]) {
        data[selectedDivision] = data[selectedDivision].filter(m => m.name.toLowerCase() !== memberName.toLowerCase());
        await saveGuildData(data);
        renderRosters();
        onDivisionChange();
    }
}

function renderRosters() {
    const data = getGuildData();
    const dynamicGrid = document.getElementById('dynamic-roster-grid');
    if (!dynamicGrid) return;

    dynamicGrid.innerHTML = '';
    let idx = 0;
    for (const divKey in data) {
        const containerId = `roster-box-${idx}`;
        const btnId = `roster-btn-${idx}`;
        const members = data[divKey] || [];

        let membersHTML = '';
        if (members.length === 0) {
            membersHTML = `<div style="padding: 8px; color: var(--text-dim); font-size: 0.85rem; text-align: center;">No members in this division.</div>`;
        } else {
            members.forEach(m => {
                const cssClass = getClassCss(m.class);
                let mainOwnerVal = m.mainOwner || m.name;
                let isDummy = mainOwnerVal.toLowerCase() !== m.name.toLowerCase();
                let displayName = m.name;
                let altTag = isDummy ? ` <small style="color:#ffaa33; font-weight:bold;">[Dummy of ${mainOwnerVal}]</small>` : '';
                
                membersHTML += `
                    <div class="roster-list-item">
                        <span>${m.icon} <span class="${cssClass}">${displayName}</span>${altTag}</span>
                        <span class="${cssClass}">${m.class}</span>
                    </div>
                `;
            });
        }

        dynamicGrid.innerHTML += `
            <div class="roster-box">
                <div class="roster-box-header" onclick="toggleDivision('${containerId}', '${btnId}')">
                    <span class="roster-box-title">🛡️ ${divKey}</span>
                    <button id="${btnId}" class="roster-toggle-btn">▼ Click to Expand</button>
                </div>
                <div id="${containerId}" class="roster-list-container">
                    ${membersHTML}
                </div>
            </div>
        `;
        idx++;
    }
}

function closeAdminModal() { document.getElementById('attendance-admin-modal').style.display = 'none'; }

function toggleDivision(rosterId, btnId) {
    const rosterContainer = document.getElementById(rosterId);
    const btn = document.getElementById(btnId);
    if (rosterContainer.style.display === "block") {
        rosterContainer.style.display = "none";
        btn.innerText = "▼ Click to Expand";
    } else {
        rosterContainer.style.display = "block";
        btn.innerText = "▲ Click to Hide";
    }
}

const allianceGuilds = [
    { name: "PROTECT GUILD", icon: "🛡️" },
    { name: "ANXIETY GUILD", icon: "⚡" },
    { name: "SPIDEY GUILD", icon: "🕷️" },
    { name: "STEALTH GUILD", icon: "⚔️" },
    { name: "VALKYRIE GUILD", icon: "✨" },
    { name: "xNOTA GUILD", icon: "🔥" }
];

let currentIndex = 0;
function rotateAllianceBadge() {
    currentIndex = (currentIndex + 1) % allianceGuilds.length;
    const guild = allianceGuilds[currentIndex];
    const iconElem = document.getElementById('rotating-icon');
    const textElem = document.getElementById('rotating-text');
    if (iconElem && textElem) {
        iconElem.innerText = guild.icon;
        textElem.innerText = guild.name;
    }
}
setInterval(rotateAllianceBadge, 3000);

window.addEventListener('DOMContentLoaded', () => {
    const savedOfficer = localStorage.getItem('kultura_logged_officer');
    if (savedOfficer) {
        currentLoggedInOfficer = savedOfficer;
        resetInactivityTimer();
    }
    renderRosters();
    updateLiveActiveWarriors();
    updatePortalButtonUI();
});

// ==========================================
// 🛒 KULTURA MARKETPLACE & MEMBER PROFILE FUNCTIONS (IP CHECK & AUTO DISCORD POST)
// ==========================================
const MARKETPLACE_DISCORD_WEBHOOK_URL = "https://kultura-webhook-proxy.official-drickz.workers.dev";

async function checkMarketplaceAuthOnLoad() {
    const loggedMarketUser = localStorage.getItem('kultura_market_user');
    const loggedMarketUsername = localStorage.getItem('kultura_market_username');
    const lockedView = document.getElementById('market-locked-view');
    const unlockedView = document.getElementById('market-unlocked-view');
    const userDisplay = document.getElementById('market-current-user-display');

    if (loggedMarketUser && loggedMarketUsername) {
        if (lockedView) lockedView.style.display = 'none';
        if (unlockedView) unlockedView.style.display = 'block';
        if (userDisplay) userDisplay.innerText = loggedMarketUser;
        
        const savedDiscordId = localStorage.getItem('kultura_market_discord_id');
        if (savedDiscordId && document.getElementById('market-discord-id')) {
            document.getElementById('market-discord-id').value = savedDiscordId;
        }

        try {
            const snap = await window.dbGet(window.dbRef(window.database, `marketplace_accounts_approved/${loggedMarketUsername}`));
            if (snap.exists()) {
                const acc = snap.val();
                if (acc.avatarUrl && document.getElementById('market-profile-avatar-url')) {
                    document.getElementById('market-profile-avatar-url').value = acc.avatarUrl;
                    document.getElementById('profile-avatar-img').src = acc.avatarUrl;
                }
                if (acc.bgUrl && document.getElementById('market-section-bg-url')) {
                    document.getElementById('market-section-bg-url').value = acc.bgUrl;
                    applyCustomSectionBg(acc.bgUrl);
                }
            }
        } catch (e) {
            console.error("Error loading settings:", e);
        }

        loadMemberFontStyles(loggedMarketUsername);
        loadSocialHubData();
    } else {
        if (lockedView) lockedView.style.display = 'block';
        if (unlockedView) unlockedView.style.display = 'none';
    }
}

// ✍️ FONT, SIZE, COLOR, & BOLD CUSTOMIZATION FUNCTIONS
function saveMemberFontStyles() {
    const fontFamily = document.getElementById('market-font-family') ? document.getElementById('market-font-family').value : "'Montserrat', sans-serif";
    const fontSize = document.getElementById('market-font-size') ? document.getElementById('market-font-size').value : "15px";
    const textColor = document.getElementById('market-text-color') ? document.getElementById('market-text-color').value : "#e0e0e8";
    const isBold = (document.getElementById('market-text-bold') && document.getElementById('market-text-bold').checked) ? 'bold' : 'normal';

    const profileSection = document.getElementById('market-unlocked-view');
    if (profileSection) {
        profileSection.style.fontFamily = fontFamily;
        profileSection.style.fontSize = fontSize;
        profileSection.style.color = textColor;
        profileSection.style.fontWeight = isBold;

        const allElements = profileSection.querySelectorAll('label, input, select, span, h4');
        allElements.forEach(el => {
            el.style.fontFamily = fontFamily;
            el.style.fontSize = fontSize;
            el.style.fontWeight = isBold;
            el.style.color = textColor;
        });
    }

    const currentUser = localStorage.getItem('kultura_market_username');
    if (currentUser && window.database) {
        const styleRef = window.dbRef(window.database, `marketplace_accounts_approved/${currentUser}/styles`);
        window.dbSet(styleRef, {
            fontFamily: fontFamily,
            fontSize: fontSize,
            textColor: textColor,
            fontWeight: isBold
        }).then(() => {
            alert('✅ Na-save at nailapat na ang iyong Font, Size, at Color settings sa form!');
        }).catch((error) => {
            console.error("Error saving font styles:", error);
        });
    } else {
        alert('✅ Nailapat na ang settings sa iyong screen!');
    }
}

function loadMemberFontStyles(username) {
    if (!window.database || !username) return;
    const styleRef = window.dbRef(window.database, `marketplace_accounts_approved/${username}/styles`);
    window.dbGet(styleRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const profileSection = document.getElementById('market-unlocked-view');
            if (profileSection) {
                if (data.fontFamily) profileSection.style.fontFamily = data.fontFamily;
                if (data.fontSize) profileSection.style.fontSize = data.fontSize;
                if (data.textColor) profileSection.style.color = data.textColor;
                if (data.fontWeight) profileSection.style.fontWeight = data.fontWeight;

                const allElements = profileSection.querySelectorAll('label, input, select, span, h4');
                allElements.forEach(el => {
                    if (data.fontFamily) el.style.fontFamily = data.fontFamily;
                    if (data.fontSize) el.style.fontSize = data.fontSize;
                    if (data.textColor) el.style.color = data.textColor;
                    if (data.fontWeight) el.style.fontWeight = data.fontWeight;
                });

                if (document.getElementById('market-font-family')) document.getElementById('market-font-family').value = data.fontFamily;
                if (document.getElementById('market-font-size')) document.getElementById('market-font-size').value = data.fontSize;
                if (document.getElementById('market-text-color')) document.getElementById('market-text-color').value = data.textColor;
                if (document.getElementById('market-text-bold')) document.getElementById('market-text-bold').checked = (data.fontWeight === 'bold');
            }
        }
    }).catch(err => console.log("Style load info:", err));
}

function applyCustomSectionBg(url) {
    const sectionContainer = document.getElementById('market-unlocked-view');
    if (!sectionContainer) return;

    if (url && url.trim() !== '') {
        sectionContainer.style.backgroundImage = `url('${url}')`;
        sectionContainer.style.backgroundSize = 'cover';
        sectionContainer.style.backgroundPosition = 'center';
        sectionContainer.style.backgroundRepeat = 'no-repeat';
        sectionContainer.style.borderRadius = '10px';
        sectionContainer.style.padding = '20px';
    } else {
        sectionContainer.style.backgroundImage = 'none';
    }
}

function toggleProfileSettingsMinimize() {
    const bodyContent = document.getElementById('profile-settings-body');
    const minBtn = document.getElementById('profile-min-btn');

    if (bodyContent.style.display === "none") {
        bodyContent.style.display = "flex";
        minBtn.innerText = "➖ Minimize";
    } else {
        bodyContent.style.display = "none";
        minBtn.innerText = "➕ Maximize";
    }
}

async function saveMemberSectionBackground() {
    const loggedMarketUsername = localStorage.getItem('kultura_market_username');
    if (!loggedMarketUsername) {
        alert("⚠️ You must be logged in to your Member Profile!");
        return;
    }

    const bgUrl = document.getElementById('market-section-bg-url').value.trim();
    
    try {
        await window.dbSet(window.dbRef(window.database, `marketplace_accounts_approved/${loggedMarketUsername}/bgUrl`), bgUrl);
        applyCustomSectionBg(bgUrl);
        alert("🎉 Successfully saved your customized background!");
    } catch (err) {
        console.error("Background Save Error:", err);
        alert("❌ Failed to save background image.");
    }
}

function openMarketRegisterModal() {
    document.getElementById('reg-market-ign').value = '';
    document.getElementById('reg-market-user').value = '';
    document.getElementById('reg-market-pass').value = '';
    document.getElementById('market-register-modal').style.display = 'flex';
}
function closeMarketRegisterModal() {
    document.getElementById('market-register-modal').style.display = 'none';
}

function openMarketLoginModal() {
    document.getElementById('login-market-user').value = '';
    document.getElementById('login-market-pass').value = '';
    document.getElementById('market-login-modal').style.display = 'flex';
}
function closeMarketLoginModal() {
    document.getElementById('market-login-modal').style.display = 'none';
}

async function submitMarketMemberRegistration() {
    const ign = document.getElementById('reg-market-ign').value.trim();
    const username = document.getElementById('reg-market-user').value.trim().toLowerCase();
    const password = document.getElementById('reg-market-pass').value.trim();

    if (!ign || !username || !password) {
        alert("⚠️ Please fill in all fields for registration!");
        return;
    }

    let userIp = "Unknown IP";
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIp = ipData.ip;
    } catch (e) {
        console.error("Failed to fetch user IP:", e);
    }

    let isDuplicateIp = false;
    let originalRegisterUser = "";
    try {
        const approvedSnap = await window.dbGet(window.dbRef(window.database, 'marketplace_accounts_approved'));
        if (approvedSnap.exists()) {
            const approvedAccounts = approvedSnap.val();
            for (let accKey in approvedAccounts) {
                if (approvedAccounts[accKey].ipAddress === userIp && userIp !== "Unknown IP") {
                    isDuplicateIp = true;
                    originalRegisterUser = approvedAccounts[accKey].username;
                    break;
                }
            }
        }

        if (!isDuplicateIp) {
            const pendingSnap = await window.dbGet(window.dbRef(window.database, 'marketplace_accounts_pending'));
            if (pendingSnap.exists()) {
                const pendingAccounts = pendingSnap.val();
                let oldestTimestamp = Date.now();
                for (let accKey in pendingAccounts) {
                    if (pendingAccounts[accKey].ipAddress === userIp && userIp !== "Unknown IP") {
                        isDuplicateIp = true;
                        if (pendingAccounts[accKey].timestamp < oldestTimestamp) {
                            oldestTimestamp = pendingAccounts[accKey].timestamp;
                            originalRegisterUser = pendingAccounts[accKey].username;
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error checking duplicate IP:", e);
    }

    const regData = {
        ign: ign,
        username: username,
        password: password,
        ipAddress: userIp,
        isDuplicateIp: isDuplicateIp,
        originalUser: originalRegisterUser || username,
        avatarUrl: "",
        bgUrl: "",
        timestamp: Date.now(),
        status: "PENDING"
    };

    try {
        await window.dbSet(window.dbRef(window.database, `marketplace_accounts_pending/${username}`), regData);
        alert("🎉 Registration successfully submitted! Please wait for SuperAdmin approval.");
        closeMarketRegisterModal();
    } catch (err) {
        console.error("Registration Error:", err);
        alert("❌ Registration failed. Please try again.");
    }
}

async function submitMarketMemberLogin() {
    const username = document.getElementById('login-market-user').value.trim().toLowerCase();
    const password = document.getElementById('login-market-pass').value.trim();

    if (!username || !password) {
        alert("⚠️ Please enter your Username and Password!");
        return;
    }

    try {
        const snapshot = await window.dbGet(window.dbRef(window.database, `marketplace_accounts_approved/${username}`));
        if (snapshot.exists()) {
            const acc = snapshot.val();
            if (acc.password === password) {
                localStorage.setItem('kultura_market_user', `${acc.ign} (@${acc.username})`);
                localStorage.setItem('kultura_market_username', acc.username);
                alert(`✅ Welcome back, ${acc.ign}! Successfully logged into Marketplace.`);
                closeMarketLoginModal();
                checkMarketplaceAuthOnLoad();
                return;
            }
        }
        alert("❌ Incorrect password or account has not been approved by SuperAdmin yet!");
    } catch (err) {
        console.error("Login Error:", err);
        alert("❌ Error during login.");
    }
}

async function saveMemberProfileAvatar() {
    const loggedMarketUsername = localStorage.getItem('kultura_market_username');
    if (!loggedMarketUsername) return;

    const avatarUrl = document.getElementById('market-profile-avatar-url').value.trim();
    
    try {
        await window.dbSet(window.dbRef(window.database, `marketplace_accounts_approved/${loggedMarketUsername}/avatarUrl`), avatarUrl);
        if (avatarUrl) {
            document.getElementById('profile-avatar-img').src = avatarUrl;
        } else {
            document.getElementById('profile-avatar-img').src = "https://nolimit.lv/themes/def_theme/images/logo.png";
        }
        alert("🎉 Successfully updated your Profile Picture!");
    } catch (err) {
        console.error("Avatar Save Error:", err);
        alert("❌ Failed to update avatar.");
    }
}

function marketLogout() {
    localStorage.removeItem('kultura_market_user');
    localStorage.removeItem('kultura_market_username');
    checkMarketplaceAuthOnLoad();
    alert("🔒 Successfully logged out from Marketplace.");
}

function loadPendingMarketAccounts() {
    const container = document.getElementById('pending-market-accounts-container');
    if (!container) return;

    window.dbOnValue(window.dbRef(window.database, 'marketplace_accounts_pending'), (snapshot) => {
        container.innerHTML = "";
        const data = snapshot.val();

        if (!data) {
            container.innerHTML = "<p style='color: var(--text-dim);'>No pending registrations found.</p>";
            return;
        }

        let accountsArray = Object.keys(data).map(key => ({ key, ...data[key] }));
        accountsArray.sort((a, b) => a.timestamp - b.timestamp);

        accountsArray.forEach((acc) => {
            const regDate = new Date(acc.timestamp).toLocaleString();
            let ipBadgeStyle = acc.isDuplicateIp ? "color: #ff3333; font-weight: bold;" : "color: #ffaa33;";
            let duplicateWarning = acc.isDuplicateIp ? `<p style="color: #ff3333; font-size: 0.8rem; font-weight: bold;">⚠️ WARNING: Same IP detected! (First registered: @${acc.originalUser})</p>` : "";

            const card = document.createElement('div');
            card.style.cssText = "background: #111; border: 1px solid #444; padding: 10px; margin-bottom: 8px; border-radius: 4px; font-size: 0.85rem;";
            card.innerHTML = `
                <p><strong>IGN:</strong> ${acc.ign}</p>
                <p><strong>Username:</strong> @${acc.username}</p>
                <p style="${ipBadgeStyle}"><strong>IP Address:</strong> ${acc.ipAddress || 'Unknown'}</p>
                ${duplicateWarning}
                <p style="color: var(--text-dim); font-size: 0.75rem;"><strong>Registration Time:</strong> ${regDate}</p>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button onclick="approveMarketAccount('${acc.username}')" style="background: #28a745; color: #fff; border: none; padding: 4px 10px; cursor: pointer; border-radius: 3px; font-weight: bold;">🟢 Approve</button>
                    <button onclick="rejectMarketAccount('${acc.username}')" style="background: #dc3545; color: #fff; border: none; padding: 4px 10px; cursor: pointer; border-radius: 3px; font-weight: bold;">🔴 Reject</button>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

async function approveMarketAccount(username) {
    const pendingRef = window.dbRef(window.database, `marketplace_accounts_pending/${username}`);
    const snap = await window.dbGet(pendingRef);
    if (!snap.exists()) return;

    const accData = snap.val();
    await window.dbSet(window.dbRef(window.database, `marketplace_accounts_approved/${username}`), accData);
    await window.dbSet(pendingRef, null);
    alert(`✅ Account @${username} has been approved! They can now log into the Marketplace.`);
}

async function rejectMarketAccount(username) {
    if (confirm(`Reject and delete registration for @${username}?`)) {
        await window.dbSet(window.dbRef(window.database, `marketplace_accounts_pending/${username}`), null);
        alert("🗑️ Registration rejected.");
    }
}

async function submitMarketplacePending() {
    const listingType = document.getElementById('market-listing-type').value;
    const seller = document.getElementById('market-seller-ign').value.trim();
    const item = document.getElementById('market-item-desc').value.trim();
    const price = document.getElementById('market-price-desc').value.trim();
    const discordId = document.getElementById('market-discord-id').value.trim();
    const loggedUsername = localStorage.getItem('kultura_market_username');

    if (!seller || !item || !price) {
        alert("⚠️ Please fill in Seller/Trader IGN, Item & Options, and Price!");
        return;
    }

    if (discordId) {
        localStorage.setItem('kultura_market_discord_id', discordId);
    }

    let userAvatarUrl = "";
    if (loggedUsername) {
        try {
            const userSnap = await window.dbGet(window.dbRef(window.database, `marketplace_accounts_approved/${loggedUsername}`));
            if (userSnap.exists()) {
                userAvatarUrl = userSnap.val().avatarUrl || "";
            }
        } catch (e) {
            console.error("Error fetching avatar:", e);
        }
    }

    let contactField = discordId 
        ? `[Direct Message Trader on Discord](https://discord.com/users/${discordId})` 
        : `In-game IGN: **${seller}**`;
    let mentionTag = discordId ? `<@${discordId}>` : `@everyone`;
    let isBuying = listingType === "BUYING";
    let typeHeader = isBuying ? "🟢 **NEW BUYING LISTING!**" : "🔴 **NEW SELLING LISTING!**";
    let embedColor = isBuying ? 3066993 : 15120128;

    let embedObject = {
        title: `📦 ${listingType || 'SELLING'} — ${seller}`,
        color: embedColor,
        fields: [
            { name: "📌 Type", value: `\`${listingType || 'SELLING'}\``, inline: true },
            { name: "👤 Trader IGN", value: `\`${seller}\``, inline: true },
            { name: "💰 Price / Offer", value: `\`${price}\``, inline: true },
            { name: "⚔️ Item & Option", value: `\`${item}\``, inline: false },
            { name: "💬 How to Contact", value: contactField, inline: false }
        ],
        footer: { text: "Kultura Guild & Alliance • Verified Marketplace", icon_url: "https://nolimit.lv/themes/def_theme/images/logo.png" },
        timestamp: new Date().toISOString()
    };

    if (userAvatarUrl) {
        embedObject.thumbnail = { url: userAvatarUrl };
    }

    const discordBody = {
        username: "Kultura Marketplace Bot",
        avatar_url: "https://nolimit.lv/themes/def_theme/images/logo.png",
        content: `${mentionTag} 🛒 ${typeHeader}`,
        embeds: [embedObject]
    };

    try {
        const response = await fetch(MARKETPLACE_DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordBody)
        });

        if (response.ok || response.status === 204) {
            alert("🎉 Success! Your Item Listing has been AUTOMATICALLY posted to the Discord Channel!");
            document.getElementById('market-item-desc').value = '';
            document.getElementById('market-price-desc').value = '';
        } else {
            alert("❌ Failed to post to Discord Webhook.");
        }
    } catch (err) {
        console.error("Direct Post Discord Error:", err);
        alert("❌ Connection error while posting to Discord.");
    }
}

// ⚖️ AUCTION MANAGER FUNCTIONS
async function addAuctionItem() {
    const itemName = document.getElementById('auction-item-name').value.trim();
    const itemPrice = document.getElementById('auction-item-price').value.trim();
    const itemStatus = document.getElementById('auction-item-status').value.trim();

    if (!itemName || !itemPrice) {
        alert("⚠️ Paki-lagyan ang Item Name at Price!");
        return;
    }

    const newItem = {
        id: Date.now(),
        name: itemName,
        price: itemPrice,
        status: itemStatus || "Open",
        timestamp: new Date().toLocaleDateString()
    };

    cloudAuctionItems.push(newItem);

    if (window.database) {
        await window.dbSet(window.dbRef(window.database, 'kultura_auction_items'), cloudAuctionItems);
    }

    document.getElementById('auction-item-name').value = '';
    document.getElementById('auction-item-price').value = '';
    document.getElementById('auction-item-status').value = '';
    renderAdminAuctionList();
    alert("🎉 Tagumpay na naidagdag ang item sa Auction Thread!");
}

function renderAdminAuctionList() {
    const container = document.getElementById('admin-auction-items-list');
    if (!container) return;

    if (!cloudAuctionItems || cloudAuctionItems.length === 0) {
        container.innerHTML = `<span style="color: var(--text-dim);">Walang auction items sa ngayon.</span>`;
        return;
    }

    container.innerHTML = "";
    cloudAuctionItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 6px; margin-bottom: 5px; background: rgba(0,0,0,0.5); border-left: 3px solid #00ffcc; border-radius: 4px;";
        div.innerHTML = `
            <div>
                <strong>⚖️ ${item.name}</strong><br>
                <small style="color: #ffdd55;">Price: ${item.price}</small> | <small style="color: #33cc33;">Status: ${item.status}</small>
            </div>
            <button onclick="deleteAuctionItem(${index})" class="delete-btn" style="padding: 3px 6px; font-size: 0.7rem;">❌ Delete</button>
        `;
        container.appendChild(div);
    });
}

async function deleteAuctionItem(index) {
    if (confirm("Sigurado ka bang gusto mong tanggalin ang item na ito sa auction?")) {
        cloudAuctionItems.splice(index, 1);
        if (window.database) {
            await window.dbSet(window.dbRef(window.database, 'kultura_auction_items'), cloudAuctionItems);
        }
        renderAdminAuctionList();
    }
}

async function sendAuctionPriceListToDiscord() {
    if (!AUCTION_DISCORD_WEBHOOK_URL) {
        alert("⚠️ Walang nakatakdang Webhook URL para sa Auction!");
        return;
    }

    if (!cloudAuctionItems || cloudAuctionItems.length === 0) {
        alert("⚠️ Walang laman ang Auction Price List para i-send!");
        return;
    }

    let fieldsArray = cloudAuctionItems.map((item, idx) => ({
        name: `📦 Item #${idx + 1}: ${item.name}`,
        value: `💰 **Price:** \`${item.price}\`\n📌 **Status:** \`${item.status}\``,
        inline: false
    }));

    try {
        const discordBody = {
            username: "Kultura Auction Bot",
            avatar_url: "https://nolimit.lv/themes/def_theme/images/logo.png",
            content: "@everyone ⚖️ **UPDATED KULTURA GUILD AUCTION PRICE LIST**",
            embeds: [{
                title: "🏛️ ACTIVE AUCTION ITEMS THREAD",
                description: "Here are the prices from the last auction!",
                color: 65535,
                fields: fieldsArray,
                footer: { text: "Kultura Guild & Alliance • Verified Auction Thread", icon_url: "https://nolimit.lv/themes/def_theme/images/logo.png" },
                timestamp: new Date().toISOString()
            }]
        };

        const res = await fetch(AUCTION_DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordBody)
        });

        if (res.ok || res.status === 204) {
            alert("🚀 Tagumpay na naipadala ang Updated Auction Price List sa Discord channel!");
        } else {
            alert("❌ Nabigong maipadala sa Discord Webhook.");
        }
    } catch (err) {
        console.error("Auction Discord Webhook Error:", err);
        alert("❌ May error sa koneksyon habang nagpapadala sa Discord.");
    }
}

// ==========================================
// 👥 KULTURA MEMBERS SOCIAL & MESSAGING LOGIC
// ==========================================

async function loadSocialHubData() {
    const loggedUsername = localStorage.getItem('kultura_market_username');
    if (!loggedUsername) return;

    const membersContainer = document.getElementById('social-members-list');
    if (membersContainer) {
        window.dbOnValue(window.dbRef(window.database, 'marketplace_accounts_approved'), (snapshot) => {
            membersContainer.innerHTML = "";
            const members = snapshot.val();
            if (!members) {
                membersContainer.innerHTML = "<span style='color: var(--text-dim);'>No other members found.</span>";
                return;
            }

            Object.keys(members).forEach((username) => {
                if (username === loggedUsername) return;
                const acc = members[username];

                const card = document.createElement('div');
                card.style.cssText = "background: #111; border: 1px solid #444; padding: 8px; margin-bottom: 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;";
                card.innerHTML = `
                    <span>👑 <strong>${acc.ign}</strong> (@${acc.username})</span>
                    <div style="display: flex; gap: 4px;">
                        <button onclick="openFriendProfileModal('${acc.username}', '${acc.ign}', '${acc.avatarUrl || ''}', '${acc.bgUrl || ''}')" class="btn" style="padding: 4px 8px; font-size: 0.75rem; background: #0088cc; color:#fff;">View Profile</button>
                        <button onclick="sendFriendRequest('${acc.username}', '${acc.ign}')" class="btn" style="padding: 4px 8px; font-size: 0.75rem;">Add Friend</button>
                    </div>
                `;
                membersContainer.appendChild(card);
            });
        });
    }

    const reqContainer = document.getElementById('social-friend-requests');
    if (reqContainer) {
        window.dbOnValue(window.dbRef(window.database, `social_requests/${loggedUsername}`), (snapshot) => {
            reqContainer.innerHTML = "";
            const requests = snapshot.val();
            if (!requests) {
                reqContainer.innerHTML = "<span style='color: var(--text-dim);'>No pending requests.</span>";
                return;
            }

            Object.keys(requests).forEach((fromUser) => {
                const reqData = requests[fromUser];
                const div = document.createElement('div');
                div.style.cssText = "background: #111; border: 1px solid #555; padding: 6px; margin-bottom: 4px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;";
                div.innerHTML = `
                    <span>From: <strong>${reqData.fromIgn}</strong></span>
                    <div>
                        <button onclick="acceptFriendRequest('${fromUser}', '${reqData.fromIgn}')" style="background: #28a745; color:#fff; border:none; padding:2px 6px; border-radius:3px; cursor:pointer;">Accept</button>
                        <button onclick="declineFriendRequest('${fromUser}')" style="background: #dc3545; color:#fff; border:none; padding:2px 6px; border-radius:3px; cursor:pointer;">Decline</button>
                    </div>
                `;
                reqContainer.appendChild(div);
            });
        });
    }

    const chatSelect = document.getElementById('chat-recipient-select');
    if (chatSelect) {
        window.dbOnValue(window.dbRef(window.database, `social_friends/${loggedUsername}`), (snapshot) => {
            chatSelect.innerHTML = `<option value="">Select a friend to chat...</option>`;
            const friends = snapshot.val();
            if (friends) {
                Object.keys(friends).forEach((friendUser) => {
                    const fData = friends[friendUser];
                    chatSelect.innerHTML += `<option value="${friendUser}">${fData.friendIgn} (@${friendUser})</option>`;
                });
            }
        });
    }
}

async function sendFriendRequest(targetUsername, targetIgn) {
    const loggedUsername = localStorage.getItem('kultura_market_username');
    const loggedIgn = localStorage.getItem('kultura_market_user');
    if (!loggedUsername) return;

    const reqRef = window.dbRef(window.database, `social_requests/${targetUsername}/${loggedUsername}`);
    await window.dbSet(reqRef, {
        fromUser: loggedUsername,
        fromIgn: loggedIgn ? loggedIgn.split(' ')[0] : loggedUsername,
        timestamp: Date.now()
    });
    alert(`🎉 Friend request successfully sent to ${targetIgn}!`);
}

async function acceptFriendRequest(fromUser, fromIgn) {
    const loggedUsername = localStorage.getItem('kultura_market_username');
    const loggedIgn = localStorage.getItem('kultura_market_user').split(' ')[0];

    await window.dbSet(window.dbRef(window.database, `social_friends/${loggedUsername}/${fromUser}`), { friendIgn: fromIgn });
    await window.dbSet(window.dbRef(window.database, `social_friends/${fromUser}/${loggedUsername}`), { friendIgn: loggedIgn });
    await window.dbSet(window.dbRef(window.database, `social_requests/${loggedUsername}/${fromUser}`), null);
    alert(`✅ You are now friends with ${fromIgn}!`);
}

async function declineFriendRequest(fromUser) {
    const loggedUsername = localStorage.getItem('kultura_market_username');
    await window.dbSet(window.dbRef(window.database, `social_requests/${loggedUsername}/${fromUser}`), null);
    alert("🗑️ Friend request declined.");
}

async function openFriendProfileModal(username, ign, avatarUrl, bgUrl) {
    document.getElementById('friend-modal-name').innerText = ign;
    document.getElementById('friend-modal-username').innerText = `@${username}`;
    
    const avatarImg = document.getElementById('friend-modal-avatar');
    avatarImg.src = avatarUrl ? avatarUrl : "https://nolimit.lv/themes/def_theme/images/logo.png";

    const banner = document.getElementById('friend-modal-banner');
    if (bgUrl) {
        banner.style.backgroundImage = `linear-gradient(rgba(10,10,15,0.6), rgba(10,10,15,0.8)), url('${bgUrl}')`;
    } else {
        banner.style.backgroundImage = 'none';
    }

    document.getElementById('friend-profile-modal').style.display = 'flex';
}

function closeFriendProfileModal() {
    document.getElementById('friend-profile-modal').style.display = 'none';
}

async function sendDirectMessage() {
    const loggedUsername = localStorage.getItem('kultura_market_username');
    const recipient = document.getElementById('chat-recipient-select').value;
    const msgInput = document.getElementById('chat-message-input');
    const msgText = msgInput.value.trim();

    if (!recipient) {
        alert("⚠️ Please select a friend from the dropdown to chat with!");
        return;
    }
    if (!msgText) return;

    const chatRoomId = [loggedUsername, recipient].sort().join('_');
    const msgRef = window.dbRef(window.database, `social_chats/${chatRoomId}`);
    
    await window.dbPush(msgRef, {
        sender: loggedUsername,
        message: msgText,
        timestamp: Date.now()
    });

    msgInput.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const chatSelect = document.getElementById('chat-recipient-select');
    if (chatSelect) {
        chatSelect.addEventListener('change', () => {
            const loggedUsername = localStorage.getItem('kultura_market_username');
            const recipient = chatSelect.value;
            const chatBox = document.getElementById('chat-messages-container');

            if (!recipient) {
                chatBox.innerHTML = `<span style="color: var(--text-dim);">Select a friend to start chatting.</span>`;
                return;
            }

            const chatRoomId = [loggedUsername, recipient].sort().join('_');
            window.dbOnValue(window.dbRef(window.database, `social_chats/${chatRoomId}`), (snapshot) => {
                chatBox.innerHTML = "";
                const msgs = snapshot.val();
                if (!msgs) {
                    chatBox.innerHTML = `<span style="color: var(--text-dim);">No messages yet. Say hello!</span>`;
                    return;
                }

                Object.values(msgs).forEach((m) => {
                    const isMe = m.sender === loggedUsername;
                    const senderColor = isMe ? "#00b4d8" : "var(--primary)";
                    chatBox.innerHTML += `<div style="margin-bottom: 4px;"><strong style="color: ${senderColor};">${isMe ? 'You' : m.sender}:</strong> ${m.message}</div>`;
                });
                chatBox.scrollTop = chatBox.scrollHeight;
            });
        });
    }
});
