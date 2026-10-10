// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "for",
  "label": [
    "for",
    "for"
  ],
  "title": [
    "Repeat a group of commands",
    "Parancsok ismétlése"
  ],
  "summary": {
    "idea": [
      "`for` repeats commands a set number of times. Indentation shows which lines repeat.",
      "A `for` megadott számban ismétli a parancsokat. A behúzás mutatja, mely sorok ismétlődnek."
    ],
    "blocksIdea": [
      "Repeat a group of blocks a set number of times, then continue after the group.",
      "Ismételj meg egy blokkcsoportot a megadott számban, majd folytasd az utána következő parancsokkal."
    ],
    "vocabulary": [
      "for",
      "range",
      "indentation"
    ]
  },
  "tools": [
    "for"
  ],
  "practice": {
    "read": "for",
    "write": "easy"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "for n in range(3):",
        "    forward()",
        "right()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 1,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      },
      "focus": {
        "en": {
          "preview": [
            [
              1,
              2,
              1,
              null
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              1,
              2,
              1,
              null
            ]
          ]
        }
      }
    },
    {
      "kind": "predict",
      "program": [
        "for n in range(2):",
        "    forward()",
        "    right()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 1,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      }
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "for n in range( ):",
        "    forward()",
        "left()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 2,
          "direction": "up"
        },
        "goal": {
          "row": 2,
          "column": 1
        },
        "obstacles": [],
        "coins": [
          [
            2,
            2
          ]
        ]
      },
      "solutions": [
        [
          "for n in range(2):",
          "    forward()",
          "left()",
          "forward()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              1,
              1,
              16,
              17
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              1,
              1,
              16,
              17
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          1,
          16,
          17
        ],
        "hu": [
          1,
          16,
          17
        ]
      },
      "revision": 4
    },
    {
      "kind": "create",
      "editable": true,
      "program": [
        ""
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 0,
          "direction": "up"
        },
        "goal": {
          "row": 0,
          "column": 4
        },
        "obstacles": [],
        "coins": [
          [
            0,
            0
          ]
        ]
      },
      "solutions": [
        [
          "for step in range(4):",
          "    forward()",
          "right()",
          "for step in range(4):",
          "    forward()"
        ]
      ],
      "revision": 3
    }
  ]
});
