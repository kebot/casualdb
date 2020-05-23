import { ID, Predicate } from './types.ts';
import matches from "https://deno.land/x/lodash/matches.js";

interface CasualInstance {
  id?: ID;
  [key: string]: any;
}

type Operand = CasualInstance | Array<CasualInstance> | null;

abstract class BaseOperator<Op extends Operand> {
  protected data: Op;

  constructor(data: Op) {
    this.data = data;
  }

  value() {
    return this.data;
  }
}

export class CasualMap<Op extends CasualInstance | null> extends BaseOperator<Op> {
  update<T = Op>(data: T) {
    return new CasualMap(data);
  }

  isNull(): boolean {
    return this.data === null;
  }
}

export class CasualCollection<Op extends CasualInstance> extends BaseOperator<Op[]>{
  constructor(data: Op[]) {
    super(data);
  }

  size(): number {
    return this.data.length;
  }


  find(predicate: Predicate<Op>) {
    const predicateFunction = typeof predicate === 'function' ? predicate : matches(predicate);
    const found = this.data.find(i => predicateFunction(i));
    return typeof found === 'undefined' ? new CasualMap(null) : new CasualMap(found);
  }

  findById(id: ID) {
    return this.find(matches({ id }));
  }

  findAndUpdate(
    predicate: Predicate<Op>,
    updateMethod: (item: Op) => Op
  ) {
    const predicateFunction = typeof predicate === 'function' ? predicate : matches(predicate);
    const updated = this.data.map(item => {
      if (predicateFunction(item)) {
        return updateMethod(item);
      }
      return item;
    });
    return new CasualCollection(updated);
  }

  findByIdAndUpdate(id: ID, updateMethod: (item: Op) => Op) {
    return this.findAndUpdate({ id } as Partial<Op>, updateMethod);
  }

  insert(...items: Op[]) {
    return new CasualCollection([...this.value(), ...items]);
  }
}