import type { Interface as ReadlineInterface } from "node:readline";

export interface TastePromptOption<T extends string = string> {
  value: T;
  label: string;
}

export interface TastePromptSession {
  write(text: string): void;
  askText(prompt: string, options?: { defaultValue?: string; allowEmpty?: boolean }): Promise<string>;
  askChoice<T extends string>(
    prompt: string,
    options: TastePromptOption<T>[],
    defaultValue?: T,
  ): Promise<T>;
  askMultiSelect<T extends string>(
    prompt: string,
    options: TastePromptOption<T>[],
    constraints: { min: number; max: number; defaultValues?: T[] },
  ): Promise<T[]>;
}

function ask(rl: ReadlineInterface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function parseSelectionNumbers(answer: string, optionCount: number): number[] | null {
  const chunks = answer
    .split(",")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk !== "");

  if (chunks.length === 0) {
    return [];
  }

  const numbers = chunks.map((chunk) => Number.parseInt(chunk, 10));
  if (numbers.some((value) => Number.isNaN(value) || value < 1 || value > optionCount)) {
    return null;
  }

  return [...new Set(numbers)];
}

export function createReadlineTastePromptSession(
  rl: ReadlineInterface,
  out: (text: string) => void = (text) => process.stderr.write(text),
): TastePromptSession {
  return {
    write(text: string) {
      out(text);
    },

    async askText(prompt: string, options: { defaultValue?: string; allowEmpty?: boolean } = {}) {
      const suffix = options.defaultValue ? ` [default: ${options.defaultValue}]` : "";

      while (true) {
        const answer = await ask(rl, `${prompt}${suffix}: `);
        if (answer !== "") {
          return answer;
        }

        if (options.defaultValue !== undefined) {
          return options.defaultValue;
        }

        if (options.allowEmpty) {
          return "";
        }

        out("Please enter a value.\n");
      }
    },

    async askChoice<T extends string>(
      prompt: string,
      options: TastePromptOption<T>[],
      defaultValue?: T,
    ) {
      const fallback = defaultValue ?? options[0]!.value;

      out(`\n${prompt}\n`);
      options.forEach((option, index) => {
        const marker = option.value === fallback ? " [default]" : "";
        out(`  ${index + 1}. ${option.label}${marker}\n`);
      });

      while (true) {
        const answer = await ask(rl, `Choose 1-${options.length}: `);
        if (answer === "") {
          return fallback;
        }

        const numeric = Number.parseInt(answer, 10);
        if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= options.length) {
          return options[numeric - 1]!.value;
        }

        out(`Please choose a number between 1 and ${options.length}.\n`);
      }
    },

    async askMultiSelect<T extends string>(
      prompt: string,
      options: TastePromptOption<T>[],
      constraints: { min: number; max: number; defaultValues?: T[] },
    ) {
      out(`\n${prompt}\n`);
      options.forEach((option, index) => {
        out(`  ${index + 1}. ${option.label}\n`);
      });

      while (true) {
        const answer = await ask(
          rl,
          `Choose ${constraints.min}-${constraints.max} items using commas (blank to skip when allowed): `,
        );

        if (answer === "" && constraints.defaultValues) {
          return [...constraints.defaultValues];
        }

        if (answer === "" && constraints.min === 0) {
          return [];
        }

        const numericSelections = parseSelectionNumbers(answer, options.length);
        if (!numericSelections) {
          out(`Please choose only numbers between 1 and ${options.length}.\n`);
          continue;
        }

        if (
          numericSelections.length < constraints.min
          || numericSelections.length > constraints.max
        ) {
          out(`Please choose between ${constraints.min} and ${constraints.max} items.\n`);
          continue;
        }

        return numericSelections.map((selectedIndex) => options[selectedIndex - 1]!.value);
      }
    },
  };
}

export function createBufferedTastePromptSession(
  rawInput: string,
  out: (text: string) => void = (text) => process.stderr.write(text),
): TastePromptSession {
  const lines = rawInput.split(/\r?\n/);
  let cursor = 0;

  function readNextLine(): string {
    if (cursor >= lines.length) {
      throw new Error("No more input available for prompt.");
    }

    const line = lines[cursor] ?? "";
    cursor += 1;
    return line.trim();
  }

  return {
    write(text: string) {
      out(text);
    },

    async askText(prompt: string, options: { defaultValue?: string; allowEmpty?: boolean } = {}) {
      const suffix = options.defaultValue ? ` [default: ${options.defaultValue}]` : "";
      out(`${prompt}${suffix}: `);
      const answer = readNextLine();

      if (answer !== "") {
        return answer;
      }

      if (options.defaultValue !== undefined) {
        return options.defaultValue;
      }

      if (options.allowEmpty) {
        return "";
      }

      throw new Error(`Prompt "${prompt}" requires a value.`);
    },

    async askChoice<T extends string>(
      prompt: string,
      options: TastePromptOption<T>[],
      defaultValue?: T,
    ) {
      const fallback = defaultValue ?? options[0]!.value;
      out(`\n${prompt}\n`);
      options.forEach((option, index) => {
        const marker = option.value === fallback ? " [default]" : "";
        out(`  ${index + 1}. ${option.label}${marker}\n`);
      });
      out(`Choose 1-${options.length}: `);

      const answer = readNextLine();
      if (answer === "") {
        return fallback;
      }

      const numeric = Number.parseInt(answer, 10);
      if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= options.length) {
        return options[numeric - 1]!.value;
      }

      throw new Error(`Prompt "${prompt}" received an invalid choice: ${answer}`);
    },

    async askMultiSelect<T extends string>(
      prompt: string,
      options: TastePromptOption<T>[],
      constraints: { min: number; max: number; defaultValues?: T[] },
    ) {
      out(`\n${prompt}\n`);
      options.forEach((option, index) => {
        out(`  ${index + 1}. ${option.label}\n`);
      });
      out(`Choose ${constraints.min}-${constraints.max} items using commas (blank to skip when allowed): `);

      const answer = readNextLine();
      if (answer === "" && constraints.defaultValues) {
        return [...constraints.defaultValues];
      }

      if (answer === "" && constraints.min === 0) {
        return [];
      }

      const numericSelections = parseSelectionNumbers(answer, options.length);
      if (!numericSelections) {
        throw new Error(`Prompt "${prompt}" received an invalid multi-select: ${answer}`);
      }

      if (
        numericSelections.length < constraints.min
        || numericSelections.length > constraints.max
      ) {
        throw new Error(
          `Prompt "${prompt}" expected ${constraints.min}-${constraints.max} selections, received ${numericSelections.length}.`,
        );
      }

      return numericSelections.map((selectedIndex) => options[selectedIndex - 1]!.value);
    },
  };
}
