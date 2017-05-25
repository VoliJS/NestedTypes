# Transactional collections core implementation

Collection implements two-phase commit transactions,
and core manipulation methods.

## Folder structure and dependencies

           index.ts
         ↗    ↑     ↖ 
    add.ts remove.ts set.ts
         ↖    ↑     ↗
           commons.ts
              ↑
      ../record/index.ts


