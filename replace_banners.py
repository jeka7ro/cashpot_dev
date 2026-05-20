import re

with open('app/src/App.svelte', 'r') as f:
    content = f.read()

start_marker = '{:else if bannersConfig.layout === "1_big_2_small"}'
end_marker = '{:else if bannersConfig.layout === "4_medium"}'

if start_marker in content and end_marker in content:
    before = content.split(start_marker)[0]
    after = content.split(end_marker)[1]
    
    new_block = """{:else if bannersConfig.layout === "1_big_2_small"}
                {@const bigItems = bannersConfig.items.filter(i => i.enabled !== false && i.position === 'big')}
                {@const small1Items = bannersConfig.items.filter(i => i.enabled !== false && i.position === 'small_1')}
                {@const small2Items = bannersConfig.items.filter(i => i.enabled !== false && i.position === 'small_2')}
                
                {#if bigItems.length > 0}
                  <div class="banner-slider-container" style="width: 100%; position: relative; overflow: hidden; border-radius: 20px; display: flex;">
                    {#each bigItems as slide, idx}
                      <div class="banner banner-large" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: {idx === slidersState.big ? '1' : '0'}; transition: opacity 0.8s ease-in-out; z-index: {idx === slidersState.big ? '2' : '1'};">
                        {#if slide.image}
                          {#if slide.image.includes('data:video/') || slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.mov')}
                            <!-- svelte-ignore a11y-media-has-caption -->
                            <video src={slide.image} class="banner-bg" autoplay loop muted playsinline style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"></video>
                          {:else}
                            <img src={slide.image} class="banner-bg" alt="Welcome Banner" />
                          {/if}
                        {/if}
                        <div class="banner-content ${(slide.tag && slide.tag.trim() !== '') || (slide.title && slide.title.trim() !== '') || (slide.subtitle && slide.subtitle.trim() !== '') || (slide.showButton && slide.buttonText && slide.buttonText.trim() !== '') ? '' : 'hide-banner-bg'}" style="color: {slide.textColor};">
                          {#if slide.tag}<span class="banner-tag">{slide.tag}</span>{/if}
                          <h2 style="color: {slide.textColor}; {slide.titleSize ? `font-size: ${slide.titleSize};` : ''}">{slide.title}</h2>
                          <p style="color: {slide.textColor}; opacity: 0.9; {slide.subtitleSize ? `font-size: ${slide.subtitleSize};` : ''}">{slide.subtitle}</p>
                          {#if slide.showButton}
                            <button class="btn-gold" style="background: {slide.buttonColor}; color: {slide.buttonTextColor}; border: {slide.buttonBorderWidth || 0}px solid {slide.buttonBorderColor || 'transparent'};">{slide.buttonText}</button>
                          {/if}
                        </div>
                      </div>
                    {/each}
                    <div class="banner banner-large" style="opacity: 0; pointer-events: none;"></div>
                    {#if bigItems.length > 1}
                      <div class="slider-dots" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10;">
                        {#each bigItems as _, idx}
                          <button on:click={() => (slidersState.big = idx)} style="width: 12px; height: 12px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8); background: {idx === slidersState.big ? '#fff' : 'transparent'}; cursor: pointer; padding: 0; transition: all 0.3s;"></button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
                <div class="banner-stack">
                  {#if small1Items.length > 0}
                    <div class="banner-slider-container banner-small" style="position: relative; overflow: hidden; border-radius: 20px; width: 100%; height: 100%; min-height: 190px;">
                      {#each small1Items as slide, idx}
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: {idx === slidersState.small_1 ? '1' : '0'}; transition: opacity 0.8s ease-in-out; z-index: {idx === slidersState.small_1 ? '2' : '1'};">
                          {#if slide.image}
                            {#if slide.image.includes('data:video/') || slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.mov')}
                              <!-- svelte-ignore a11y-media-has-caption -->
                              <video src={slide.image} class="banner-bg" autoplay loop muted playsinline style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"></video>
                            {:else}
                              <img src={slide.image} alt="Promo" class="banner-bg" style="object-position: center;" />
                            {/if}
                          {/if}
                          <div class="banner-content ${(slide.tag && slide.tag.trim() !== '') || (slide.title && slide.title.trim() !== '') || (slide.subtitle && slide.subtitle.trim() !== '') || (slide.showButton && slide.buttonText && slide.buttonText.trim() !== '') ? '' : 'hide-banner-bg'}" style="color: {slide.textColor};">
                            {#if slide.tag && slide.tag.trim() !== ""}<span class="banner-tag">{slide.tag}</span>{/if}
                            {#if slide.title && slide.title.trim() !== ""}<h3 style="color: {slide.textColor}; {slide.titleSize ? `font-size: ${slide.titleSize};` : ''}">{slide.title}</h3>{/if}
                            {#if slide.subtitle && slide.subtitle.trim() !== ""}<p style="color: {slide.textColor}; opacity: 0.9; {slide.subtitleSize ? `font-size: ${slide.subtitleSize};` : ''}">{slide.subtitle}</p>{/if}
                            {#if slide.showButton && slide.buttonText && slide.buttonText.trim() !== ""}<button class="btn-gold" style="padding: 6px 12px; font-size: 12px; margin-top: 8px; background: {slide.buttonColor}; color: {slide.buttonTextColor}; border: {slide.buttonBorderWidth || 0}px solid {slide.buttonBorderColor || 'transparent'};">{slide.buttonText}</button>{/if}
                          </div>
                        </div>
                      {/each}
                      <div class="banner banner-small" style="opacity: 0; pointer-events: none; min-height: 190px;"></div>
                      {#if small1Items.length > 1}
                        <div class="slider-dots" style="position: absolute; bottom: 10px; right: 10px; display: flex; gap: 6px; z-index: 10;">
                          {#each small1Items as _, idx}
                            <button on:click={() => (slidersState.small_1 = idx)} style="width: 8px; height: 8px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.8); background: {idx === slidersState.small_1 ? '#fff' : 'transparent'}; cursor: pointer; padding: 0; transition: all 0.3s;"></button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                  {#if small2Items.length > 0}
                    <div class="banner-slider-container banner-small" style="position: relative; overflow: hidden; border-radius: 20px; width: 100%; height: 100%; min-height: 190px;">
                      {#each small2Items as slide, idx}
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: {idx === slidersState.small_2 ? '1' : '0'}; transition: opacity 0.8s ease-in-out; z-index: {idx === slidersState.small_2 ? '2' : '1'};">
                          {#if slide.image}
                            {#if slide.image.includes('data:video/') || slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.mov')}
                              <!-- svelte-ignore a11y-media-has-caption -->
                              <video src={slide.image} class="banner-bg" autoplay loop muted playsinline style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"></video>
                            {:else}
                              <img src={slide.image} alt="Promo" class="banner-bg" style="object-position: center;" />
                            {/if}
                          {/if}
                          <div class="banner-content ${(slide.tag && slide.tag.trim() !== '') || (slide.title && slide.title.trim() !== '') || (slide.subtitle && slide.subtitle.trim() !== '') || (slide.showButton && slide.buttonText && slide.buttonText.trim() !== '') ? '' : 'hide-banner-bg'}" style="color: {slide.textColor};">
                            {#if slide.tag && slide.tag.trim() !== ""}<span class="banner-tag">{slide.tag}</span>{/if}
                            {#if slide.title && slide.title.trim() !== ""}<h3 style="color: {slide.textColor}; {slide.titleSize ? `font-size: ${slide.titleSize};` : ''}">{slide.title}</h3>{/if}
                            {#if slide.subtitle && slide.subtitle.trim() !== ""}<p style="color: {slide.textColor}; opacity: 0.9; {slide.subtitleSize ? `font-size: ${slide.subtitleSize};` : ''}">{slide.subtitle}</p>{/if}
                            {#if slide.showButton && slide.buttonText && slide.buttonText.trim() !== ""}<button class="btn-gold" style="padding: 6px 12px; font-size: 12px; margin-top: 8px; background: {slide.buttonColor}; color: {slide.buttonTextColor}; border: {slide.buttonBorderWidth || 0}px solid {slide.buttonBorderColor || 'transparent'};">{slide.buttonText}</button>{/if}
                          </div>
                        </div>
                      {/each}
                      <div class="banner banner-small" style="opacity: 0; pointer-events: none; min-height: 190px;"></div>
                      {#if small2Items.length > 1}
                        <div class="slider-dots" style="position: absolute; bottom: 10px; right: 10px; display: flex; gap: 6px; z-index: 10;">
                          {#each small2Items as _, idx}
                            <button on:click={() => (slidersState.small_2 = idx)} style="width: 8px; height: 8px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.8); background: {idx === slidersState.small_2 ? '#fff' : 'transparent'}; cursor: pointer; padding: 0; transition: all 0.3s;"></button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              """

    with open('app/src/App.svelte', 'w') as f:
        f.write(before + new_block + end_marker + after)
    print("Successfully replaced block.")
else:
    print("Could not find markers.")
