// CVA composition follows shadcn's MIT Button pattern; see SHADCN_LICENSE.
import { cva } from 'class-variance-authority';
export const buttonVariants = cva('bui-button bui:shrink-0 bui:select-none', {
  variants:{
    variant:{primary:'bui-button--primary',accent:'bui-button--accent',secondary:'bui-button--secondary',ghost:'bui-button--ghost',danger:'bui-button--danger'},
    size:{sm:'bui-button--sm',md:'bui-button--md',lg:'bui-button--lg'},
  },
  defaultVariants:{variant:'primary',size:'md'},
});
