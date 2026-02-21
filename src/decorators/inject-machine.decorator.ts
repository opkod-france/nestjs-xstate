import { Inject } from '@nestjs/common';
import { getMachineToken } from '../constants';

export const InjectMachine = (name: string): ParameterDecorator =>
  Inject(getMachineToken(name));
