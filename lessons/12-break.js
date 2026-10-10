// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "break",
  "label": [
    "break",
    "break"
  ],
  "title": [
    "Leave a loop deliberately",
    "Lépj ki tudatosan a ciklusból"
  ],
  "summary": {
    "idea": [
      "`break` ends only the innermost loop; the program continues after that loop.",
      "A `break` csak a legbelső ciklusból lép ki; a program a ciklus utáni paranccsal folytatódik."
    ],
    "vocabulary": [
      "while True",
      "break"
    ]
  },
  "tools": [
    "whats",
    "while",
    "if",
    "break",
    "in"
  ],
  "practice": {
    "read": "while",
    "write": "hard"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "for side in range(2):",
        "    while True:",
        "        if whats(\"ahead\") == \"obstacle\":",
        "            break",
        "        forward()",
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
        "obstacles": [
          [
            1,
            1
          ],
          [
            2,
            4
          ]
        ]
      },
      "focus": {
        "en": {
          "preview": [
            [
              4
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              4
            ]
          ]
        }
      },
      "revision": 4
    },
    {
      "kind": "predict",
      "program": [
        "for side in range(2):",
        "    while True:",
        "        if whats(\"ahead\") == \"wall\":",
        "            break",
        "        forward()",
        "    right()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 2,
          "column": 1,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      },
      "revision": 3
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "while True:",
        "    if whats(\"ahead\") == \"wall\":",
        "        right()",
        "        ",
        "    forward()",
        "forward()",
        "right()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 1,
          "column": 1,
          "direction": "up"
        },
        "goal": {
          "row": 1,
          "column": 2
        },
        "obstacles": [],
        "coins": [
          [
            0,
            1
          ],
          [
            0,
            2
          ]
        ]
      },
      "solutions": [
        [
          "while True:",
          "    if whats(\"ahead\") == \"wall\":",
          "        right()",
          "        break",
          "    forward()",
          "forward()",
          "right()",
          "forward()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              4,
              4,
              9,
              10
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              4,
              4,
              9,
              10
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          4,
          9,
          9
        ],
        "hu": [
          4,
          9,
          9
        ]
      },
      "revision": 3
    },
    {
      "kind": "create",
      "editable": true,
      "program": [],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 1,
          "direction": "up"
        },
        "goal": {
          "row": 1,
          "column": 4
        },
        "obstacles": [
          [
            4,
            2
          ],
          [
            3,
            2
          ],
          [
            2,
            2
          ]
        ],
        "coins": [
          [
            1,
            1
          ]
        ]
      },
      "solutions": [
        [
          "while True:",
          "    if whats(\"right\") == \"clear\":",
          "        break",
          "    forward()",
          "right()",
          "while whats(\"ahead\") == \"clear\":",
          "    forward()",
          "forward()"
        ]
      ],
      "revision": 3,
      "commentTranslations": [
        [
          "# Walk ahead; break when the right square is clear.",
          "# Haladj előre; break, ha jobbra szabad a mező."
        ],
        [
          "# After the loop: right, then coins and the star.",
          "# Utána jobbra; szedd fel az érméket a csillagig."
        ]
      ]
    }
  ]
});
