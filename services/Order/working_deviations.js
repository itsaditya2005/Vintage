const TECHNICIAN_DATA = [];

let working_deviation = 0;
let break_deviation = 0;
let overlap_start = null;
let overlap_end = null;
let BREAK_EARLY_OR_LATE = 'NA';
let break_overlap_duration = 0;
let DAY_EARLY_OR_LATE = 'NA';

let SST = new Date(`2024-12-26T09:00:00`); 
let SET = new Date(`2024-12-26T19:00:00`); 
let BST = new Date(`2024-12-26T13:00:00`); 
let BET = new Date(`2024-12-26T13:30:00`); 
let JST = new Date(`2024-12-26T19:30:00`); 
let JET = new Date(`2024-12-26T20:00:00`); 

if (JST >= SST && JET <= SET) {
    console.log("Job is fully within technician service time")
    // Job is fully within technician service time
    working_deviation = 0;

    if (JST < BST && JET > BST && JET < BET) {
        // Job overlaps with break start
        console.log("\n Job overlaps with break start")
        overlap_start = BST;
        overlap_end = JET;
        break_overlap_duration = (overlap_end - overlap_start) / 60000;
        break_deviation = break_overlap_duration;
        BREAK_EARLY_OR_LATE = 'E';
    } else if (JST > BST && JST < BET && JET <= BET) {
        if (JST > BST && JET < BET) {
            console.log("\n Job overlaps with break end 1")
            overlap_start = JST;
            overlap_end = JET;
            break_overlap_duration = (overlap_end - overlap_start) / 60000;
            break_deviation = break_overlap_duration;
            BREAK_EARLY_OR_LATE = 'E';
        } else if (JST > BST && JET <= BET) {
            console.log("\n Job overlaps with break 2")
            overlap_start = JST;
            overlap_end = JET;
            break_overlap_duration = (overlap_end - overlap_start) / 60000;
            break_deviation = break_overlap_duration;
            BREAK_EARLY_OR_LATE = 'E';
        } else {
            console.log("\n Job overlaps with break end")
            overlap_start = BST;
            overlap_end = JET;
            break_overlap_duration = (overlap_end - overlap_start) / 60000;
            break_deviation = break_overlap_duration;
            BREAK_EARLY_OR_LATE = 'L';
        }
    } else if (JST <= BST && JET >= BET) {
        console.log("\n Job overlaps with entire break")
        overlap_start = BST;
        overlap_end = BET;
        break_overlap_duration = (overlap_end - overlap_start) / 60000;
        break_deviation = 1000;
    } else if (JST > BST && JET <= SET && BET <= JET) {
        console.log("job in between")
        if (JET < SET) {
            break_deviation = 0;

        } else {
            overlap_start = JST;
            overlap_end = BET;
            break_overlap_duration = (overlap_end - overlap_start) / 60000; // ms to minutes
            break_deviation = break_overlap_duration;
            BREAK_EARLY_OR_LATE = 'E';
        }

    }
} else if (JST < SST && JET > BST && JET <= BET && JET >= SET) {
    console.log("Job starts before service time and ends within break time")
    // Job starts before service time and ends within break time 
    working_deviation = 1000;
    break_deviation = (JET - BST) / 60000;
    BREAK_EARLY_OR_LATE = 'L';
} else if (JST < SST && JET > BST && JET <= BET && JET <= SET) {
    console.log("Job starts before service time and ends AFTER break time")
    // Job starts before service time and ends within break time 
    working_deviation = (SST - JST) / 60000;
    break_deviation = (JET - BST) / 60000;
    overlap_start = BST;
    overlap_end = JET;
    break_overlap_duration = (overlap_end - overlap_start) / 60000;
    BREAK_EARLY_OR_LATE = 'L';
    DAY_EARLY_OR_LATE = 'E';
} else if (JST >= SST && JST < BST && JET > BET && JET <= SET) {
    // Job starts during service time, overlaps with entire break, and ends after break 
    console.log("Job starts during service time, overlaps with entire break, and ends after break")
    working_deviation = 0;
    break_deviation = 1000;
    BREAK_EARLY_OR_LATE = 'E';
} else if (JST >= SST && JST < BST && JET > BET && JET > SET) {
    // Job starts during service time, overlaps with entire break, and ends after day ends 
    console.log("Job starts during service time, overlaps with entire break, and ends after day ends")
    working_deviation = (JET - SET) / 60000;
    break_deviation = 1000;
    overlap_start = BST;
    overlap_end = BET;
    break_overlap_duration = (overlap_end - overlap_start) / 60000;
    DAY_EARLY_OR_LATE = 'L';
} else if (JST >= SST && BST >= JST) {
    console.log("job start time is greter or equal to service start time")
    working_deviation = (JET - SET) / 60000;
    break_deviation = 1000;
    overlap_start = BST;
    overlap_end = BET;
    break_overlap_duration = (overlap_end - overlap_start) / 60000;
    DAY_EARLY_OR_LATE = 'L';
} else if (JET <= SET && BET >= SET) {
    console.log("job end time is less or equal to service end time")
    working_deviation = (SST - JST) / 60000;
    DAY_EARLY_OR_LATE = 'E';
} else if (JST <= SST && BET <= JET && BST.getTime() !== JET.getTime()) {
    console.log("Condition passed: Job start time <= service start time and break end time <= service end time.");
    working_deviation = (SST - JST) / 60000;
    break_deviation = 1000;
    overlap_start = BST;
    overlap_end = BET;
    break_overlap_duration = (overlap_end - overlap_start) / 60000;
    DAY_EARLY_OR_LATE = 'E';
    BREAK_EARLY_OR_LATE = 'NA';
} else if ((JET < SST || JST > SET) && (JST < BST || JET > BET)) {
    console.log("Job starts or ends outside technician service hours111")
    working_deviation = 1000;
    break_deviation = 1000;
} else if (JST <= SST && BET <= SET && BST.getTime() == JET.getTime()) {
    console.log("11Job starts or ends outside technician service hours1")
    working_deviation = (SST - JST) / 60000;
    break_deviation = (BST - JET) / 6000;
    overlap_start = BST;
    overlap_end = JET;
    break_overlap_duration = (overlap_end - overlap_start) / 60000;
    DAY_EARLY_OR_LATE = 'E';
    BREAK_EARLY_OR_LATE = 'NA';
} else if (JST <= SST && JET <= BET) {
    console.log("job start before day start and ends before break")
    working_deviation = (SST - JST) / 60000;
    DAY_EARLY_OR_LATE = 'E';
} else if (JST <= BET && JET >= SET) {
    console.log("job ends after day end and start at break end")
    working_deviation = (JET - SET) / 60000;
    DAY_EARLY_OR_LATE = 'L';
} else if (JST > BET && JET > SET) {
    console.log("Service start after break and ends after day end")
    working_deviation = (JET - SET) / 60000;
    DAY_EARLY_OR_LATE = 'L';
} else {
    working_deviation = 1000;
}

TECHNICIAN_DATA.push({
    WORK_DEVIATIONS: working_deviation,
    BREAK_DEVIATIONS: break_deviation,
    BREAK_OVERLAP_DURATIONS: break_overlap_duration,
    overlap_start: overlap_start ? overlap_start.toLocaleTimeString() : null,
    overlap_end: overlap_end ? overlap_end.toLocaleTimeString() : null,
    BREAK_EARLY_OR_LATE,
    DAY_EARLY_OR_LATE
});

console.log("TECHNICIAN_DATA:", TECHNICIAN_DATA);