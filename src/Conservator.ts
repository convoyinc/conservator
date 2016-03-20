/**
 * File glob expressions, parsed by [micromatch](https://www.npmjs.com/package/micromatch).
 */
export type Glob  = string;
export type Globs = Glob|Glob[];

/**
 * Configuration for which files trigger a command to run.
 *
 * It can be a glob expression:
 *
 *     'src/*.js'
 *
 * This indicates that the command should run any time a file matching that glob
 * expression is changed.
 *
 * Or, the configuration can be a map of globs to glob _substitutions_:
 *
 *     {'src/(*).js': 'test/unit/${1}.js'}
 *
 * In this case, any time a file changes in `src/`, the corresponding file in
 * `test/unit/` will be run.  You can use regex-style capture groups in the
 * source glob, and expand them via `${#}` where `#` is the index of the group.
 */
export type Watch = Glob|{[key:string]:Globs};

type _Command = {
  command:string[],
};

/**
 * A collection of scripts that should be run, and when.
 */
export default class Conservator {

  private _commands:_Command[] = [];

  /**
   * A command that should be run, and watches that describe which files trigger
   * it.
   */
  run(command:string[], _watches:Watch|Watch[]):void {
    this._commands.push({
      command,
    });
  }

  /**
   * Starts watching for changes.
   *
   * Resolves when the user interrupts the process, and rejects if something
   * goes catastrophically wrong.
   */
  async start():Promise<void> {
    console.log('running');
  }

}
