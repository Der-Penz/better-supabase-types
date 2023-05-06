#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generate } from './generate';
import { z } from 'zod';
import fs from 'fs';

const configExists = fs.existsSync('.betterrc.json');
const prePackageJsonFile = fs.readFileSync('package.json', 'utf-8');
const packageJsonFile = JSON.parse(prePackageJsonFile);
const isString = (item: unknown): item is string => typeof item === 'string';

// Load config from '.betterrc' file
if (configExists) {
  const schema = z
    .object({
      input: z.string(),
      output: z.string().optional(),
      force: z.boolean().optional(),
      prettier: z.string().optional().default('.prettierrc'),
      schemas: z.array(z.string()).optional().default(['public']),
    })
    .strict();

  const prefile = fs.readFileSync('.betterrc.json', 'utf-8');
  const json = JSON.parse(prefile);

  // Check if config is correct
  const result = schema.safeParse(json);
  if (!result.success) {
    console.log('Invalid config file');
  } else {
    if (!result.data.output && !result.data.force) {
      console.log(
        'It looks like you want to overwrite your input file. Add the force property to do that in your config file.'
      );
    } else {
      const input = result.data.input;
      const output = result.data.output || result.data.input;
      const prettier = result.data.prettier;
      const schemas = result.data.schemas;

      generate(input, output, prettier, schemas);
    }
  }
} else if (packageJsonFile['betterConfig']) {
  // Load config from 'package.json' file
  const schema = z
    .object({
      input: z.string(),
      output: z.string().optional(),
      force: z.boolean().optional(),
      prettier: z.string().optional().default('.prettierrc'),
      schemas: z.array(z.string()).optional().default(['public']),
    })
    .strict();

  // Check if config is correct
  const result = schema.safeParse(packageJsonFile['betterConfig']);
  if (!result.success) {
    console.log('Invalid config in package.json');
  } else {
    if (!result.data.output && !result.data.force) {
      console.log(
        'It looks like you want to overwrite your input file. Add the force property to do that in your config file.'
      );
    } else {
      const input = result.data.input;
      const output = result.data.output || result.data.input;
      const prettier = result.data.prettier;
      const schemas = result.data.schemas;

      generate(input, output, prettier, schemas);
    }
  }
} else {
  // Load config from command line
  yargs(hideBin(process.argv))
    .command(
      '*',
      '',
      (yargs) => {
        return yargs
          .options({
            input: {
              type: 'string',
              alias: ['i'],
              describe: 'Path to the input file',
              requiresArg: true,
            },
            output: {
              type: 'string',
              alias: ['o'],
              describe: 'Path to the output file',
              requiresArg: true,
            },
            prettier: {
              type: 'string',
              alias: ['p'],
              describe: 'Path to the prettier config file',
              requiresArg: false,
              default: '.prettierrc',
            },
            force: {
              type: 'boolean',
              alias: ['f'],
              describe: 'Force the overwrite of the input file',
            },
            schemas: {
              type: 'array',
              alias: ['s'],
              describe: 'List of schema names to include in the output',
              requiresArg: false,
              default: ['public'],
            },
          })
          .demandOption(['input']);
      },
      (argv) => {
        if (!argv.output && !argv.force) {
          console.error(
            'It looks like you want to overwrite your input file. Add the force flag to do that.'
          );
          return;
        }

        const input = argv.input;
        const output = argv.output || argv.input;
        const prettier = argv.prettier;
        const schemaArgs: (string|number)[] = argv.schemas;
        const schemas = schemaArgs.reduce((acc: string[], schema: string|number): string[] => {
          if (isString(schema)) {
            acc.push(schema);
          }
          else {
            acc.push(schema.toString());
          }
          return acc;
        }, []);

        generate(input, output, prettier, schemas);
      }
    )
    .help()
    .strict()
    .parse();
}
