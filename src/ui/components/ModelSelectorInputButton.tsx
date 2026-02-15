import { Button } from './ui/button';
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from './ai-elements/model-selector';
import { useListModels } from '@/model/api/models';
import type { ModelIdentifier } from '@api/ai/model';
import type { JSX } from 'react';
import React from 'react';
import { CheckIcon, RefreshCcw } from 'lucide-react';

interface ModelSelectorInputButtonProps {
  refetch: () => Promise<void>;
  selectedModel: ModelIdentifier;
  setSelectedModel: React.Dispatch<React.SetStateAction<ModelIdentifier | null>>;
  isSelectedModel: (model: ModelIdentifier) => boolean;
}

export default function ModelSelectorInputButton(
  props: ModelSelectorInputButtonProps,
): JSX.Element {
  const { selectedModel, setSelectedModel, isSelectedModel } = props;
  const [open, setOpen] = React.useState(false);
  const { data: modelsList, refetch } = useListModels();

  const refetchModelData = async () => {
    await refetch();
    await props.refetch();
  };

  return (
    <div>
      <ModelSelector onOpenChange={setOpen} open={open}>
        <ModelSelectorTrigger asChild>
          <Button className="justify-between" variant="outline">
            <ModelSelectorLogo provider={selectedModel.provider} />
            <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
          </Button>
        </ModelSelectorTrigger>
        <ModelSelectorContent aria-describedby="model-selector-input">
          <ModelSelectorInput id="model-selector-input" placeholder="search models..." />
          <div className="flex justify-center p-1">
            <RefetchModelsButton refetch={refetchModelData} />
          </div>
          <ModelSelectorList>
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            {modelsList.map(([provider, models]) => (
              <ModelSelectorGroup heading={provider} key={provider}>
                {models.map((model) => (
                  <ModelSelectorItem
                    key={model.name}
                    onSelect={() => {
                      setSelectedModel(model);
                      setOpen(false);
                    }}
                    value={model.name}
                  >
                    <ModelSelectorLogo provider={provider} />
                    <ModelSelectorName>{model.displayName}</ModelSelectorName>
                    {isSelectedModel(model) ? (
                      <CheckIcon className="ml-auto size-4" />
                    ) : (
                      <div className="ml-auto size-4" />
                    )}
                  </ModelSelectorItem>
                ))}
              </ModelSelectorGroup>
            ))}
          </ModelSelectorList>
        </ModelSelectorContent>
      </ModelSelector>
    </div>
  );
}

interface RefetchModelsButtonProps {
  refetch: () => Promise<void>;
}
function RefetchModelsButton(props: RefetchModelsButtonProps): JSX.Element {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="cursor-pointer"
      onClick={(ev) => {
        props.refetch();
        ev.stopPropagation();
      }}
    >
      refetch models
      <RefreshCcw />
    </Button>
  );
}
