import * as _ from 'lodash';
import * as chokidar from 'chokidar';
import * as debug from 'debug';

const log = debug('Conservator');

/**
 * File path or glob expressions, as parsed by
 * [micromatch](https://www.npmjs.com/package/micromatch).
 */
export type Glob = string;
/**
 * A file path or glob that supports replacements in the form of `$#`.
 */
export type GlobTransform = string;
/**
 * A function that maps a file (and glob match) to another file or glob.
 */
export type MapperFunc = (path:string, match:RegExpExecArray) => Glob|Glob[];
export type Mapper = GlobTransform|GlobTransform[]|MapperFunc;

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
 * source glob, and expand them via `$#` where `#` is the index of the group.
 *
 * You can also map to an array of globs:
 *
 *     {'src/(*).js': ['test/unit/${1}.js', 'test/unit/${1}/*.js']}
 *
 * Finally, the mapper can also be a function that returns a path, glob, or
 * array of globs:
 *
 *     {'src/(*).js': (_path, match) => `test/unit/${match[1]}.js`}
 *
 */
export type Watch = Glob|{[key:string]:Mapper};

type _NormalizedWatch = {
  source:Glob,
  transform?:MapperFunc,
};
type _Command = {
  command:string[],
  watches:_NormalizedWatch[],
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
  run(command:string[], watches:Watch|Watch[]):void {
    const normalized = {
      command,
      watches: this._normalizeWatches(watches),
    };
    this._commands.push(normalized);
    log('run()', 'globs:', _.map(normalized.watches, 'source'), 'for command:', command);
  }

  /**
   * Starts watching for changes.
   *
   * Resolves when the user interrupts the process, and rejects if something
   * goes catastrophically wrong.
   */
  async start():Promise<void> {
    const globs = this._allGlobs();
    log('Watching:', globs);

    chokidar.watch(globs)
      .on('add',    (path:string) => log('file added  ', path))
      .on('change', (path:string) => log('file changed', path))
      .on('unlink', (path:string) => log('file removed', path));
  }

  private _normalizeWatches(denormalized:Watch|Watch[]):_NormalizedWatch[] {
    const watches:Watch[] = Array.isArray(denormalized) ? denormalized : [denormalized];
    const result:_NormalizedWatch[] = [];

    watches.forEach((watch) => {
      // Glob
      if (typeof watch === 'string') {
        result.push({source: watch});

      // {Glob: Mapper}
      } else {
        Object.keys(watch).forEach(glob => {
          const mapper = watch[glob];
          // {Glob: MapperFunc}
          if (typeof mapper === 'function') {
            result.push({source: glob, transform: <MapperFunc> mapper});

          // {Glob: GlobTransform}
          } else if (typeof mapper === 'string') {
            result.push({source: glob, transform: this._compileTransform(mapper)});

          // {Glob: GlobTransform[]}
          } else {
            (<GlobTransform[]>mapper).forEach(globTransform => {
              result.push({source: glob, transform: this._compileTransform(globTransform)});
            });
          }
        });
      }
    });

    return result;
  }

  private _compileTransform(transform:GlobTransform):MapperFunc {
    const template = transform
      .replace(/(`|\\|\$\{)/g, '\\$1') // Sanitize the template string.
      .replace(/\$(\d+)/g, '${match[$1]}');

    return <MapperFunc> new Function('path', 'match', `return \`${template}\`;`);
  }

  private _allGlobs():Glob[] {
    return <Glob[]> _(this._commands)
      .map(c => _.map(c.watches, 'source'))
      .flatten()
      .value();
  }

}
