'use strict';

/** Followers Page */

const followersCtx = document.getElementById('followersChart').getContext('2d');
let followersChart;

let last30DaysStats = createLast30DaysObject();

fetchNextNoti({ to: -1 });

function createLast30DaysObject() {
    let obj = {};
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    for (let i = 0; i <= 30; i++) {
        const day = new Date(year, month - 1, date + i);
        const key = getDateKeyFromEpoch(day);
        obj[key] = {
            follow: { count: 0, followers: [] },
            highlight: { count: 0, posts: [] },
            clap: { count: 0, posts: [] },
        };
    }
    return obj;
}

function fetchNextNoti({ to }) {
    const fetchUrl = to === -1 ? MEDIUM_NOTI_STATS_URL : `${MEDIUM_NOTI_STATS_URL}&to=${to}`;
    const isRollup = (type) => type.slice(type.length - 6, type.length) === 'rollup';

    fetch(fetchUrl)
        .then((response) => response.text())
        .then((response) => {
            const data = parseMediumResponse(response);
            const { value, paging } = data.payload;

            value.forEach((notiItem) => {
                if (isRollup(notiItem.activityType)) {
                    notiItem.rollupItems.forEach((noti) => countSingleNoti(noti));
                } else {
                    countSingleNoti(notiItem);
                }
            });

            if (paging && paging.next) {
                fetchNextNoti(paging.next);
            } else {
                renderFollowersChart();
            }
        })
        .catch((err) => {
            document.querySelector('#followers_loader').style.display = 'none';
            console.error(err);
        });
}

function countSingleNoti(noti) {
    const date = new Date(noti.occurredAt);
    const key = getDateKeyFromEpoch(date);
    if (last30DaysStats[key] !== undefined) {
        if (noti.activityType === NOTI_EVENT_TYPE.follow) {
            last30DaysStats[key].follow.count++;
            last30DaysStats[key].follow.followers.push(noti.actorId);
        } else if (noti.activityType === NOTI_EVENT_TYPE.clap) {
            last30DaysStats[key].clap.count++;
            last30DaysStats[key].clap.posts.push(noti.postId);
        } else if (noti.activityType === NOTI_EVENT_TYPE.highlight) {
            last30DaysStats[key].highlight.count++;
            last30DaysStats[key].highlight.posts.push(noti.postId);
        }
    }
}

function renderFollowersChart() {
    document.querySelector('#followers_loader').style.display = 'none';
    followersChart = new Chart(followersCtx, {
        type: 'line',
        data: {
            labels: Object.keys(last30DaysStats).map(
                (key) => `${Math.floor((key % 10000) / 100)}/${key % 100}`
            ),
            datasets: [
                {
                    label: 'Daily followers',
                    borderColor: '#6e72b7',
                    backgroundColor: 'rgba(80, 141, 162, 0.9)',
                    data: [...Object.keys(last30DaysStats).map((key) => last30DaysStats[key].follow.count)],
                },
            ],
        },
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: `Last 30 Days Followers(No cancellation included): ${Object.keys(last30DaysStats).reduce(
                    (acc, key) => (acc += last30DaysStats[key].follow.count),
                    0
                )}`,
                position: 'bottom',
            },
            elements: {
                line: {
                    backgroundColor: 'rgba(0,0,0,0)',
                    pointBackgroundColor: 'rgba(0,0,0,0)',
                    tension: 0,
                },
            },
        },
    });
}

