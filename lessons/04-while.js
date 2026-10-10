// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "while",
  "label": [
    "while",
    "while"
  ],
  "title": [
    "Repeat while it is true",
    "Ismételj, amíg igaz"
  ],
  "summary": {
    "idea": [
      "`while` repeats while its condition is true, checking again before each repeat.",
      "A `while` addig ismétel, amíg a feltétele igaz. Minden ismétlés előtt újra ellenőriz."
    ],
    "vocabulary": [
      "while",
      "True",
      "False"
    ]
  },
  "tools": [
    "whats",
    "while"
  ],
  "practice": {
    "read": "while",
    "write": "medium"
  },
  "observation": {
    "direction": "ahead",
    "from": "before"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "while whats(\"ahead\") == \"clear\":",
        "    forward()",
        "right()",
        "while whats(\"ahead\") == \"clear\":",
        "    forward()",
        "left()"
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
        "obstacles": [
          [
            0,
            1
          ],
          [
            1,
            2
          ]
        ]
      },
      "focus": {
        "en": {
          "preview": [
            [
              1,
              6,
              1,
              null
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              1,
              6,
              1,
              null
            ]
          ]
        }
      },
      "revision": 4
    },
    {
      "kind": "predict",
      "program": [
        "right()",
        "while whats(\"ahead\") == \"clear\":",
        "    forward()",
        "left()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 3,
          "direction": "up"
        },
        "goal": null,
        "obstacles": [
          [
            3,
            4
          ]
        ]
      },
      "revision": 4
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "while whats(\"ahead\") == \"clear\":",
        "    ",
        "right()",
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
          "column": 3
        },
        "obstacles": [
          [
            1,
            2
          ]
        ],
        "coins": [
          [
            2,
            2
          ]
        ]
      },
      "solutions": [
        [
          "while whats(\"ahead\") == \"clear\":",
          "    forward()",
          "right()",
          "forward()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              2,
              2,
              5,
              6
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              2,
              2,
              5,
              6
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          2,
          5,
          5
        ],
        "hu": [
          2,
          5,
          5
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
          "row": 3,
          "column": 4,
          "direction": "up"
        },
        "goal": {
          "row": 2,
          "column": 1
        },
        "obstacles": [
          [
            3,
            0
          ]
        ],
        "coins": [
          [
            0,
            4
          ],
          [
            0,
            0
          ],
          [
            2,
            0
          ]
        ]
      },
      "solutions": [
        [
          "while whats(\"ahead\") == \"clear\":",
          "    forward()",
          "left()",
          "while whats(\"ahead\") == \"clear\":",
          "    forward()",
          "left()",
          "while whats(\"ahead\") == \"clear\":",
          "    forward()",
          "left()",
          "forward()"
        ]
      ],
      "revision": 4
    }
  ]
});
