// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "variables",
  "label": [
    "Variables",
    "Változók"
  ],
  "title": [
    "Remember and update a number",
    "Jegyezz meg és változtass meg egy számot"
  ],
  "summary": {
    "idea": [
      "Store a number in a variable, update it as Koja moves, then use it again later.",
      "Tárolj egy számot változóban, módosítsd Koja lépései közben, majd használd fel újra."
    ],
    "vocabulary": [
      "=",
      "+=",
      "print"
    ]
  },
  "tools": [
    "variable",
    "update",
    "print",
    "while"
  ],
  "practice": {
    "read": "while",
    "write": "medium"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "steps = 0",
        "while steps < 2:",
        "    forward()",
        "    steps += 1",
        "    print(steps)",
        "right()",
        "for step in range(steps):",
        "    forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 2,
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
      },
      "revision": 4
    },
    {
      "kind": "predict",
      "program": [
        "remaining = 3",
        "while remaining > 1:",
        "    forward()",
        "    remaining -= 1",
        "right()",
        "for step in range(remaining):",
        "    forward()",
        "print(remaining)"
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
      },
      "revision": 4
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "steps = 0",
        "while steps < 3:",
        "    forward()",
        "    ",
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
        "goal": {
          "row": 1,
          "column": 2
        },
        "obstacles": [],
        "coins": [
          [
            1,
            1
          ]
        ]
      },
      "solutions": [
        [
          "steps = 0",
          "while steps < 3:",
          "    forward()",
          "    steps += 1",
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
              5,
              6
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              4,
              4,
              5,
              6
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          4,
          5,
          5
        ],
        "hu": [
          4,
          5,
          5
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
          "column": 0,
          "direction": "up"
        },
        "goal": {
          "row": 0,
          "column": 3
        },
        "obstacles": [
          [
            0,
            0
          ]
        ],
        "coins": [
          [
            1,
            0
          ],
          [
            1,
            3
          ]
        ]
      },
      "solutions": [
        [
          "steps = 0",
          "while whats(\"ahead\") == \"clear\":",
          "    forward()",
          "    steps += 1",
          "print(steps)",
          "right()",
          "for step in range(steps):",
          "    forward()",
          "left()",
          "forward()"
        ]
      ],
      "revision": 3,
      "commentTranslations": [
        [
          "# Count your steps until the obstacle.",
          "# Számold a lépéseidet az akadályig."
        ],
        [
          "# Turn right, reuse the count; then left to the star.",
          "# Jobbra ugyanennyi lépés; balra a csillag felé."
        ]
      ]
    }
  ]
});
